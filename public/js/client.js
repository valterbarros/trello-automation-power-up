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
    const apiAttachment = options.attachments.find((attachment) => attachment.url.match(/api.github.com/u))

    if (!apiAttachment) {
      return []
    }

    return t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
      const githubToken = githubUserInfo.ghToken

      return [
        // Shows if the pull request is draft
        {
          dynamic: function() {
            return fetch(apiAttachment.url, {
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
            const getPrReviews = `${apiAttachment.url}/reviews`;

            return fetch(getPrReviews, {
              headers: {
                Authorization: `token ${githubToken}`
              }
            })
            .then((result) => result.json())
            .then((reviews) => {
              const MY_USER = 'valterbarros';

              let approvedCount = 0;
              // maybe receive my review from a text field on frontend]
              const myReview = reviews.reverse().find((r) => r.user.login === MY_USER && ['DISMISSED', 'APPROVED'].includes(r.state));
              const lastNotMyself = reviews.reverse().find((r) => r.user.login !== MY_USER);

              const lastTwo = myReview ? [lastNotMyself, myReview] : reviews.slice(reviews.length - 2);

              reviews.forEach((review) => {
                if (review.state === 'APPROVED') {
                  approvedCount += 1
                }
              });

              const text = lastTwo.filter(Boolean).reduce((accumulator, review /*state user.login*/) => {
                let currentAccumulator = accumulator;

                let statusLabel = ''

                if (review.state === 'APPROVED') {
                  statusLabel = 'OK'
                } else if (review.state === 'COMMENTED') {
                  statusLabel = 'CO'
                } else if (review.state === 'DISMISSED') {
                  statusLabel = 'DI'
                } else {
                  statusLabel = 'NO'
                }

                const prefix = review.user.login === MY_USER ? 'ME' : review.user.login.substring(0, 1).toLocaleUpperCase();

                const nameAndStatus = `${prefix}: ${statusLabel} `

                currentAccumulator += nameAndStatus

                return currentAccumulator
              }, '') || 'No Reviews'

              return {
                text,
                color: approvedCount > 1
                ? 'green'
                : 'yellow',
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
  }
});
