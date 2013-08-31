/* TODO:
  - user fill in there username and fullname(first & last)
  - add Who's here feature that shows all the fullnames(username)
  - everytime a message is inserted along with the timestamp, update group's last_modified
*/

// Meteor collections
groups = new Meteor.Collection("groups");
messages = new Meteor.Collection("messages");

// Setting session variables to modify the client data & templates
Session.setDefault('user_signed_in', false);
Session.setDefault('group_id', null);
Session.setDefault('group_available', true);
Session.setDefault('adding_group', false);

// Setting up the user creation form to have username & optional email
Accounts.ui.config({
  requestOfflineToken: {
    google: true
  },
  passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
});

// Check if user signed in. Display changes accordingly.
Deps.autorun(function(){
  if(Meteor.userId()){
    Session.set('user_signed_in', true);
  }
  else{
    Session.set('user_signed_in', false); 
  }
});
Deps.flush();

Template.content.signed_in = function() {
  return Session.equals('user_signed_in', true);
};

// Subscribe to 'groups' collection on startup.
// Select a group once data has arrived.
if(Meteor.userId()){
  var groupHandle = Meteor.subscribe('groups', function () {
    if (!Session.get('group_id')) {
      var group = groups.findOne({users: Meteor.userId()}, {sort: {timestamp: -1}});
      if(group){
        var userAr = groups.findOne({_id: group._id}).users;
        var i=0, user;
        var is_user_group = false;
        while(user = userAr[i++]){
          if(user.toLowerCase() === Meteor.user()._id.toLowerCase()){
            is_user_group = true;
            break;
          }
        }
      }
      if (group && is_user_group){
        Router.setGroup(group._id);
        is_user_group = false;
      }
      else
        Session.set('group_available', false);
    }
  });
}

var messagesHandle = null;
// Always be subscribed to the messages for the selected group.
Deps.autorun(function () {
  if(Meteor.userId()){
    var group_id = Session.get('group_id');
    if (group_id)
      messagesHandle = Meteor.subscribe('messages', group_id);
    else
      messagesHandle = null;
  }
});

//********* Groups ***********//

// User's groups displayed 
// Groups related event handling
Template.sidebar.loading = function(){
  return !groupHandle.ready();
};
Template.sidebar.myGroups = function(){
  var user_id = Meteor.userId();
  return groups.find({users: user_id});
};

Template.sidebar.new_group_adding = function(){
  return Session.equals('adding_group', true);
};

Template.sidebar.events({
  'mousedown .group-tag': function(e){
    Router.setGroup(this._id);
  },
  'click #add-group': function(e, t){
    Session.set('adding_group', true);
    Meteor.flush();
    focusText(document.getElementById("group-textbox"));
  },
  'keyup #group-textbox': function(e, t){
    if(e.which === 13){
      var text = String(e.target.value || "");
      if(text){
        var user_id = Meteor.userId();
        groups.insert({
          name: text, 
          users:[user_id], 
          owner: user_id, 
          timestamp: (new Date()).getTime()
        });
        Session.set('adding_group', false);
        Session.set('group_available', true);
      }
    }
  },
  'focusout #group-textbox': function(e,t){
    Session.set('adding_group', false);
  },
  'mousedown .user-tag': function(e){
    groups.update({_id: Session.get('group_id')},{$addToSet: {users: this._id}});
  }
});


//********* Messages ***********//

// Group messages and event handling

Template.user_page.is_group_available = function(){
  return Session.equals('group_available', true);
};
Template.user_page.loading = function(){
  return !groupHandle.ready() && messagesHandle && !messagesHandle.ready();
};

Template.user_page.group_name = function(){
  if(Session.get('group_id'))
    return groups.findOne({_id: Session.get('group_id')}).name;
  return "";
};

Template.user_page.msgs = function(){
  var group = Session.get('group_id');
  return messages.find({group_id: group}, {sort: {timestamp: -1}});
};


Template.sidebar.users = function(){
  var group = Session.get('group_id');
  var users = groups.findOne({_id: group}).users;
  return Meteor.users.find({_id:{$ne: users}});
};

Template.user_page.events({
  'keyup #message-textbox': function(e, t){
    if(e.which === 13){
      var msg = String(e.target.value || "");
      if(msg){
        var un = Meteor.user().username;
        messages.insert({
          group_id: Session.get('group_id'),
          username: un,
          text: msg,  
          timestamp: (new Date()).getTime()
        });
        // TODO: modify the timestamp of the group also
        e.target.value = "";
      }
    }
  }
});


//this function puts our cursor where it needs to be.
function focusText(i) {
  i.focus();
  i.select();
};

////////// Tracking selected chat-group in URL //////////

var ChatRouter = Backbone.Router.extend({
  routes: {
    ":group_id": "main"
  },
  main: function (group_id) {
    var oldGroup = Session.get("group_id");
    if (oldGroup !== group_id) {
      Session.set("group_id", group_id);
    }
  },
  setGroup: function (group_id) {
    this.navigate(group_id, true);
  }
});

Router = new ChatRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});
