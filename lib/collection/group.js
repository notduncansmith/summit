var _ = require('lodash');

module.exports = GroupCollection;

function GroupCollection () {

}

GroupCollection.prototype.contains = function (id, opts) {
  var keys = _.isArray(id) ? id : [id]
    , self = this
    , view = (opts && opts.view) ? opts.view : 'contains'; // Allow the user to override the view used

  var params = {
    keys: keys
  };

  return this.view(view, params)
  .then(function (results) {
    if (opts && (opts.includeGroups || opts.include_docs || opts.includeDocs)) {
      var groupIds = _.uniq(_.map(results, 1));
      return self.db.fetch(groupIds)
      .then(function (groups) {
        groups = _.indexBy(groups[0].rows, 'id');
        return results.map(function (pair) {
          pair[1] = groups[pair[1]];
          return pair;
        });
      });
    }
    else {
      return results;
    }
  })
  .then(function (results) {
    var groupings = {};

    if (opts && opts.raw) {
      return results;
    }

    var found = results.map(function (pair) {
      var userId = pair[0]
        , groupId = pair[1];

      if (!groupings[userId]) {
        groupings[userId] = [groupId];
      }
      else {
        groupings[userId].push(groupId);
      }

      return pair[0];
    });

    _.difference(keys, found)
    .forEach(function (userId) {
      groupings[userId] = false;
    });

    return groupings;
  });
};

GroupCollection.prototype.findByName = function (name) {
  return this.view('byGroupName', {key: name});
};

GroupCollection.prototype.addUserToGroup = function(userId, groupId) {
  return this.update('addUser', groupId, {user: userId});
};

GroupCollection.prototype.removeUserFromGroup = function(userId, groupId) {
  return this.update('removeUser', groupId, {user: userId});
};

GroupCollection.fields = {
  fields: {
    name: 'string'
  }
};

GroupCollection.design = {};

GroupCollection.design.views = {
  contains: {
    map: function (doc) {
      if (doc.type === '{{name}}' && doc.users) {
        for (var i=0, l=doc.users.length; i<l; i+=1) {
          emit(doc.users[i], [doc.users[i], doc._id]);
        }
      }
    }
  },

  byGroupName: {
    map: function (doc) {
      if (doc.type === '{{name}}' && doc.name) {
        emit(doc.name, doc);
      }
    }
  }
};

GroupCollection.design.updates = {
  addUser: function (doc, req) {
    var user = req.form.user;

    if (doc.users && doc.users.length > 0) {
      if (doc.users.indexOf(user) >= 0) {
        return [doc, user];
      }
      else {
        doc.users.push(user);
      }
    }
    else {
      doc.users = [user];
    }

    return [doc, user];
  },

  removeUser: function (doc, req) {
    var user = req.form.user;

    if (doc.users && doc.users.length > 0) {
      doc.users.splice(doc.users.indexOf(user), 1);
    }
    else {
      doc.users = [];
    }

    return [doc, user];
  }
};