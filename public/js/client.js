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
    const apiAttachment = options.attachments.find((attachment) => attachment.url.match(/api.github.com/u))

    if (!apiAttachment) {
      return []
    }

    return t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
      const githubToken = githubUserInfo.ghToken

      // console.log(githubToken);
      // console.log(apiAttachment);

      return [
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

              return {
                text: pullRequest.state,
                icon: PR_ICON,
                color: pullRequest.state === 'open'
                ? 'green'
                : 'purple',
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
  "board-buttons": function(t, opts) {
    return [
      {
        text: 'hey',
        callback: function(t, opts) {
          t.get('board', 'shared').then((result) => {
            console.log(result);
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
        callback: function(t, opts) {
          // await t.remove('board', 'shared', 'github_user_info')
          let listBoardId = ''

          t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
            const githubToken = githubUserInfo.ghToken
            const pullRequestUrl = githubUserInfo.pullRequestUrl
            listBoardId = githubUserInfo.listBoardId

            return fetch(pullRequestUrl, {
              headers: {
                Authorization: `token ${githubToken}`
              }
            });
          })
          .then((result) => {
            return result.json()
          })
          .then((result) => {
            console.log(result);
            allPrs = {}

            const getRequestsMap = result.map(pullRequest => {
              const pullRequestUrl = pullRequest.html_url;

              // const previousPrs = JSON.parse(localStorage.getItem('savedPullRequests'));
              // console.log(previousPrs);

              // localStorage.setItem('savedPullRequests', JSON.stringify({...previousPrs, ...{[pullRequestUrl]: true}}))

              if(!false) {
                const pullRequestApiUrl = pullRequest.url;
                const userName = pullRequest.user.login;
                const prState = pullRequest.state
                const splittedUrl = pullRequestUrl.split('/');
                const prNumber = splittedUrl[splittedUrl.length - 1];
                const cardTitle = pullRequest.title;
                const repoName = pullRequest.base.repo.name

                return window.Trello.post("/card", {
                  name: `${cardTitle} [${repoName}] [${userName}] #${prNumber} [${prState}]`,
                  idList: listBoardId,
                  pos: "top"
                }).then(card => {
                  return window.Trello.post(`/card/${card.id}/attachments`, {
                    name: "github pull request",
                    url: pullRequestUrl
                  });
                }).then(() => {
                  // return window.Trello.post(`/card/${card.id}/attachments`, {
                  //   name: "github pull request api",
                  //   url: pullRequestApiUrl
                  // });
                  return
                }).then(() => {
                  allPrs[pullRequestUrl] = true
                })
              }
            })

            Promise.all(getRequestsMap).then(() => {
              console.log(allPrs);
              return t.remove('board', 'shared', ['https://github.com/TIDYAPP/homekeeper-app-v3/pull/303',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/304',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/305',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/306',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/310',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/311',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/312',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/313',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/314',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/315',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/316',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/317',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/318',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/319',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/320',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/321',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/322',
              'https://github.com/TIDYAPP/homekeeper-app-v3/pull/323',
              'https://github.com/TIDYAPP/payments_api/pull/14',
              'https://github.com/TIDYAPP/payments_api/pull/199',
              'https://github.com/TIDYAPP/payments_api/pull/231',
              'https://github.com/TIDYAPP/payments_api/pull/233',
              'https://github.com/TIDYAPP/payments_api/pull/235',
              'https://github.com/TIDYAPP/payments_api/pull/237',
              'https://github.com/TIDYAPP/payments_api/pull/239',
              'https://github.com/TIDYAPP/payments_api/pull/241',
              'https://github.com/TIDYAPP/payments_api/pull/242',
              'https://github.com/TIDYAPP/payments_api/pull/243',
              'https://github.com/TIDYAPP/payments_api/pull/244',
              'https://github.com/TIDYAPP/payments_api/pull/245',
              'https://github.com/TIDYAPP/payments_api/pull/246',]);
            }).then(() => {
              t.get('board', 'shared').then((data) => {
                console.log(data);
                
              })
            })
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
