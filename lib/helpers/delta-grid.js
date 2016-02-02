module.exports = function (Handlebars, _) {
  Handlebars.registerHelper('deltaGrid', function () {
    var columns = this.columns;
    var list = this.list;
    var actionUrl = this.actionUrl;
    var actions = this.actions;
    var url = this.url;
    var info = this.info;
    var noResultsMessage = this.noResultsMessage;

    if (!columns && list.length) {
      columns = _.mapValues(list[0], function (item, key) {
        return {};
      });
    }

    var html = '<form method="POST"';
    if (actionUrl)
      html += ' action="' + actionUrl + '"';
    html += '><div class="row"><div class="col-xs-12">';
    _.forIn(actions, function (action, key) {
      if ((list && list.length) || action.showOnEmpty) {
        if (action.html)
          html += action.html;
        else
          html += '<input type="submit" class="action btn btn-default btn-sm ' + (action.classes || '') + '" name="action" value="' + Handlebars.Utils.escapeExpression(key) + '" /> ';
      }
    });
    html += '</div></div>';

    if (!list || !list.length) {
      html += '<div class="row"><div class="col-xs-12">';
      html += noResultsMessage || '<h3>No results found</h3>';
      html += '</div></div></form>'
    }else{
      html += '<div class="row"><div class="col-xs-12"><div class="table-responsive"><table class="table"><thead><tr>';
      _.forIn(columns, function (c, key) {
        if (c.classes)
          html += '<th class="' + c.classes + '">';
        else
          html += '<th>';
        html += (c.title === undefined || c.title === null ? key : c.title) + '</th>';
      });
      html += '</tr></thead><tbody>';

      list.forEach(function (item) {
        html += '<tr>';
        _.forIn(columns, function (c, key) {
          if (c.classes)
            html += '<td class="' + c.classes + '">';
          else
            html += '<td>';
          if (c.formatter) {
            var result = c.formatter(item[key], item, key);
            if (c.template) {
              var local = _.extend(item, result);
              html += Handlebars.compile(c.template)(local);
            }else{
              html += result;
            }
          }
          else if (c.template)
            html += Handlebars.compile(c.template)(item);
          else if (c.isId)
            html += '<input type="checkbox" name="' + key + '" value="' + item[key] + '" />';
          else
            html += Handlebars.Utils.escapeExpression(item[key]);
          html += '</td>';
        });
        html += '</tr>';
      });

      html += '</table></div></div></div></form>';

      if (info) {
        html += '<div class="row"><div class="col-xs-4">';
        if (info.start > 1) {
          var prevUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'start=' + info.previous;
          html += '<p class="text-left"><a href="' + prevUrl + '">Prev</a></p>'
        }
        html += '</div><div class="col-xs-4"><p class="text-center">Displaying ' + info.start + ' to ' + info.end;
        if (info.length)
          html +=' of ' + info.length;
        html += '</p></div><div class="col-xs-4">';
        if (info.next) {
          var nextUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'start=' + info.next;
          html += '<p class="text-right"><a href="' + nextUrl + '">Next</a></p>';
        }
        html += '</div></div>';
      }
    }

    return new Handlebars.SafeString(html);
  });
};