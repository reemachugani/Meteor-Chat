// groups -- { name: String,
//			   users: [user_id1, user_id2, ...], 
//			   owner: user_id,
//			   last_modified: Number
//			 }
groups = new Meteor.Collection("groups");

Meteor.publish('groups', function(){
	if(this.userId)
		return groups.find({users: this.userId});
	else
		return null;
});

groups.allow({
	insert: function(userId, doc){
		return true;
	},
	remove: function(userId, doc){
		return doc.owner === userId;
	},
	fetch: ['owner']
});


// messages -- { group_id: groups_id,
//				 username: user.username,
//				 text: String,
//				 timestamp: Number
//			   }
messages = new Meteor.Collection("messages");

Meteor.publish('messages', function(group_id){
	check(group_id, String);
	return messages.find({group_id: group_id});
});

messages.allow({
	insert: function(userId, doc){
		return groups.find({_id: doc.group_id, users: userId}) != null;
	},
	remove: function(userId, doc){
		return groups.find({_id: doc.group_id, owner: userId}) != null;
	},
	fetch: ['group_id']
});


Meteor.users.allow({
	remove: function(userId, doc){
		return false;
	}
});