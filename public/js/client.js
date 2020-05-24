/* global TrelloPowerUp */

function fromMilisecondsToHoursAndMinutes(time) {
  // console.log(time)
  const seconds = parseInt(time / 1000);
  const minutes = parseInt(seconds / 60);
  const hours = parseInt(minutes / 60);
  const days = parseInt(hours / 24);

  if (hours >= 24) {
    return `${days}d`;
  }

  if (minutes >= 60) {
    return `${hours}h`;
  }

  if (seconds < 60) {
    return `few seconds`;
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }
}

var Promise = TrelloPowerUp.Promise;

var PR_ICON = 'https://github.trello.services/images/pull-request.svg?color=fff';

var GITHUB_ICON = 'https://github.trello.services/images/icon.svg?color=42536e';

/* TODO use import */
window.Trello.authorize({
  type: "popup",
  name: "Automatizations Trello Power-Up",
  scope: {
    read: "true",
    write: "true"
  },
  expiration: "never"
});

TrelloPowerUp.initialize({
  //Start adding handlers for your capabilities here!
  // "card-buttons": function(t, options) {
  //   return [
  //     {
  //       icon: GITHUB_ICON,
  //       text: "GitHub",
  //       callback: function(t) {
  //         return t.popup({
  //           title: "GitHub Selection",
  //           url: "github_info_popup.html"
  //         });
  //       }
  //     }
  //   ];
  // },
  // "card-badges2": function(
  //   t,
  //   options /* Returns some data from current card like id, etc*/
  // ) {
  //   // console.log(t)
  //   // console.log(options)
  //   // let cardName = await t.card('id').get('id')
  //   // console.log(cardName)
  //   return t
  //     .card("dateLastActivity")
  //     .get("dateLastActivity")
  //     .then(lastActivity => {
  //       return lastActivity;
  //     })
  //     .then(lastActivity => {
  //       const getId = t.card("id").get("id");

  //       return Promise.all([getId, lastActivity]);
  //     })
  //     .then(([cardId, lastActivity]) => {
  //       const getActions = window.Trello.get(`/cards/${cardId}/actions`);
  //       return Promise.all([getActions, lastActivity]);
  //     })
  //     .then(([actions, lastActivity]) => {
  //       // console.log(actions.find((action) => action.type === 'updateCard' || action.type === 'createCard'))
  //       const createOrUpdateCard = actions.find(action => {
  //         return action.type === "updateCard" || action.type === "createCard";
  //       });

  //       // actions.forEach((action) => {
  //       //   console.log(action.data.card.name)
  //       //   if(action.data.card.name === 'asds') {
  //       //     console.log(action)
  //       //   }
  //       // })
  //       // console.log(actions)

  //       if (createOrUpdateCard) {
  //         // console.log(createOrUpdateCard)
  //         return createOrUpdateCard.date;
  //       } else {
  //         return lastActivity;
  //       }
  //     })
  //     .then(lastMoveListDate => {
  //       // console.log(lastMoveListDate)
  //       return fromMilisecondsToHoursAndMinutes(
  //         Math.abs(new Date(lastMoveListDate) - new Date())
  //       );
  //     })
  //     .then(hours => {
  //       return [
  //         {
  //           icon: BLACK_ROCKET_ICON,
  //           text: `${hours}`
  //         }
  //       ];
  //     })
  //     .catch(err => {
  //       console.log(err);
  //     });
  // },
  "card-badges": function(
    t,
    options /* Returns some data from current card like id, etc*/
  ) {
    return [
      {
        dynamic: function() {
          t.get('card', 'shared', 'prUrl').then((prLink) => {
            console.log(prLink)
          })
          return {
            refresh: 99999999999999999
          }
        }
      }
    ]
  },
  "board-buttons": function(t, opts) {
    return [
      {
        // we can either provide a button that has a callback function
        icon: {
          dark: PR_ICON,
          light: PR_ICON
        },
        text: "Sync Pull Requests",
        condition: "edit",
        callback: function(t, opts) {
          // await t.remove('board', 'shared', 'github_user_info')
          let listBoardName = ''

          const getPullRequests = t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
            const githubToken = githubUserInfo.ghToken
            const pullRequestUrl = githubUserInfo.pullRequestUrl
            listBoardName = githubUserInfo.listBoardName

            return fetch(pullRequestUrl, {
              headers: {
                Authorization: `token ${githubToken}`
              }
            });
          })

          return Promise.all([getPullRequests, t.lists("id", "name")])
            .then(([result, pullRequestsListIdAndName]) => {
              return Promise.all([
                result.json(),
                pullRequestsListIdAndName.find(
                  list => list.name.toLowerCase() === listBoardName
                )
              ]);
            })
            .then(([result, pullRequestsListIdAndName]) => {
              console.log(pullRequestsListIdAndName);
              console.log(result);
              result.forEach(pullRequest => {
                const pullRequestUrl = pullRequest.html_url;
                const pullRequestApiUrl = pullRequest.url;
                const userName = pullRequest.user.login;
                const prState = pullRequest.state
                const splittedUrl = pullRequestUrl.split('/');
                const prNumber = splittedUrl[splittedUrl.length - 1];
                const cardTitle = pullRequest.title;
                const repoName = pullRequest.base.repo.name

                // t.set("board", "shared", pullRequestUrl, true);

                window.Trello.post("/card", {
                  name: `${cardTitle} [${repoName}] [${userName}] #${prNumber} [${prState}]`,
                  idList: pullRequestsListIdAndName.id,
                  pos: "top"
                }).then(card => {
                  window.Trello.post(`/card/${card.id}/attachments`, {
                    name: "github pull request",
                    url: pullRequestUrl
                  });

                  window.Trello.post(`/card/${card.id}/attachments`, {
                    name: "github pull request api",
                    url: pullRequestApiUrl
                  });
                });
              });
            })
            .catch((err) => {
              console.log(err);
            })
          // End
        }
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
