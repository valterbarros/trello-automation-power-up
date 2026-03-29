/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;

var PR_ICON = 'https://github.trello.services/images/pull-request.svg?color=fff';

var GITHUB_ICON = 'https://github.trello.services/images/icon.svg?color=42536e';

import { fillPullrequestCallback } from '../callbacks/fill-pullrequest';
import auth from './auth'
auth();

TrelloPowerUp.initialize({
  "card-badges": function(
    t,
    options /* Returns some data from current card like id, etc*/
  ) {
    // example: https://api.github.com/repos/clicksign/nova-widget/pulls/602
    // https://github.com/clicksign/nova-widget/pull/602
    const ghUrl = options.attachments.find((attachment) => attachment.url.match(/github.com/u));
    // console.log('ghUrl', ghUrl);

    if (!ghUrl) return [];

    const apiAttachment = ghUrl.url.replace('https://github.com', 'https://api.github.com/repos').replace('pull', 'pulls');

    // console.log('apiAttachment', apiAttachment);

    return t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
      const githubToken = githubUserInfo.ghToken

      return [
        // Shows if the pull request is draft
        {
          dynamic: function() {
            return fetch(apiAttachment, {
              headers: {
                Authorization: `token ${githubToken}`
              }
            })
            .then((result) => result.json())
            .then((pullRequest) => {
              // console.log(pullRequest);

              const isDraft = pullRequest.draft;

              let color;

              if (pullRequest.state === 'open') color = 'green';
              if (pullRequest.state === 'closed') color = 'purple';
              if (pullRequest.draft) color = 'blue';

              return {
                text: isDraft ? 'draft' : pullRequest.state,
                icon: PR_ICON,
                color,
                refresh: 30
              }
            })
          }
        },
        // Shows reviwers status limited to two
        {
          dynamic: function() {
            const getPrReviews = `${apiAttachment}/reviews`;

            return fetch(`https://localhost:12769/reviews?url=${getPrReviews}`)
              .then((result) => result.json())
              .then(({text, color}) => {
              return {
                text,
                color,
                refresh: 30
              }
            })
          }
        }
      ]
    })
    .catch((err) => {
      console.log(err);
    })
  },
  "board-buttons": function(/*t, opts*/) {
    return [
      {
        // Remove all shared board data(pr links) in case of exceed the trello power up storage
        text: 'Reset data',
        callback: function(t) {
          const allowedKeys = ['github_user_info'];

          t.get('board', 'shared').then((result) => {
            // We don't want remove settings data only saved pr urls
            const keysToRemove = Object.keys(result).filter((key) => !allowedKeys.includes(key));

            t.remove('board', 'shared', keysToRemove);
          })
        }
      },
      {
        // we can either provide a button that has a callback function
        icon: {
          dark: PR_ICON,
          light: PR_ICON
        },
        text: "Sync Pull Requests",
        condition: "edit",
        callback: fillPullrequestCallback
      },
      {
        icon: GITHUB_ICON,
        text: "Configure your github account",
        callback: function(t) {
          return t.popup({
            title: "GitHub Selection",
            url: "/public/github_info_popup.html"
          });
        }
      }
    ];
  },
  'list-actions': function (t) {
    return t.list('name', 'id', 'cards')
      .then(function (list) {
        return [{
          text: "Get List Stats",
          callback: function (t) {
            return t.popup({
              title: "List to import",
              url: "/public/copy-trello-list.html",
              args: { list },
            });
          }
        }];
      });
  }
});
