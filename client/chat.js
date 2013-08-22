/* TODO:
  - user fill in there username and fullname(first & last)
  - add Who's here feature that shows all the fullnames(username)
  - 
*/

// Meteor collections
groups = new Meteor.Collection("groups");
messages = new Meteor.Collection("messages");

// Setting session variables to modify the client data & templates
Session.setDefault('group_id', null);
Session.setDefault('no_group_selected', true);
Session.set('user_signed_in', false);

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
if(user_signed_in){
  var groupHandle = Meteor.subscribe('groups', function () {
    if (!Session.get('group_id')) {
      var group = groups.findOne({}, {sort: {last_modified: -1}});
      if (group)
        Router.setGroup(group._id);
    }
  });
}

var messagesHandle = null;
// Always be subscribed to the messages for the selected group.
Deps.autorun(function () {
  if(user_signed_in){
    var group_id = Session.get('group_id');
    if (group_id)
      messagesHandle = Meteor.subscribe('messages', group_id);
    else
      messagesHandle = null;
  }
});


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
