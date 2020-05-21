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

var BLACK_ROCKET_ICON =
  "https://cdn.glitch.com/d4365d9f-3a05-45c9-b54f-84473b6fe27c%2Fpngguru.com.png?v=1589678814619";
var WHITE_ICON =
  "https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-white.svg";
var PR_ICON = 'https://github.trello.services/images/pull-request.svg?color=fff'

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
  "card-buttons": function(t, options) {
    return [
      {
        icon: BLACK_ROCKET_ICON,
        text: "Estimate Size",
        callback: function(t) {
          return t.popup({
            title: "Estimation",
            url: "estimate.html"
          });
        }
      }
    ];
  },
  "card-badges2": function(
    t,
    options /* Returns some data from current card like id, etc*/
  ) {
    // console.log(t)
    // console.log(options)
    // let cardName = await t.card('id').get('id')
    // console.log(cardName)
    return t
      .card("dateLastActivity")
      .get("dateLastActivity")
      .then(lastActivity => {
        return lastActivity;
      })
      .then(lastActivity => {
        const getId = t.card("id").get("id");

        return Promise.all([getId, lastActivity]);
      })
      .then(([cardId, lastActivity]) => {
        const getActions = window.Trello.get(`/cards/${cardId}/actions`);
        return Promise.all([getActions, lastActivity]);
      })
      .then(([actions, lastActivity]) => {
        // console.log(actions.find((action) => action.type === 'updateCard' || action.type === 'createCard'))
        const createOrUpdateCard = actions.find(action => {
          return action.type === "updateCard" || action.type === "createCard";
        });

        // actions.forEach((action) => {
        //   console.log(action.data.card.name)
        //   if(action.data.card.name === 'asds') {
        //     console.log(action)
        //   }
        // })
        // console.log(actions)

        if (createOrUpdateCard) {
          // console.log(createOrUpdateCard)
          return createOrUpdateCard.date;
        } else {
          return lastActivity;
        }
      })
      .then(lastMoveListDate => {
        // console.log(lastMoveListDate)
        return fromMilisecondsToHoursAndMinutes(
          Math.abs(new Date(lastMoveListDate) - new Date())
        );
      })
      .then(hours => {
        return [
          {
            icon: BLACK_ROCKET_ICON,
            text: `${hours}`
          }
        ];
      })
      .catch(err => {
        console.log(err);
      });
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
          const pullRequestsUrl =
            "<project pull requests url goes here ex: https://api.github.com/repos/:owner/:repo/pulls more about https://developer.github.com/v3/pulls/>";
          const getPullRequests = fetch(pullRequestsUrl, {
            headers: {
              Authorization: "token <your github token goes here more about that https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line>"
            }
          });

          return Promise.all([getPullRequests, t.lists("id", "name")])
            .then(([result, pullRequestsListIdAndName]) => {
              return Promise.all([
                result.json(),
                pullRequestsListIdAndName.find(
                  list => list.name.toLowerCase() === "todo"
                )
              ]);
            })
            .then(([result, pullRequestsListIdAndName]) => {
              console.log(pullRequestsListIdAndName);
              result.forEach(pullRequest => {
                const pullRequestUrl = pullRequest.html_url;
                const userName = pullRequest.user.login;
                const prState = pullRequest.state
                const splittedUrl = pullRequestUrl.split('/');
                const prNumber = splittedUrl[splittedUrl.length - 1];
                const cardTitle = pullRequest.title;

                // t.set("board", "shared", pullRequestUrl, true);

                window.Trello.post("/card", {
                  name: `${cardTitle} [${userName}] #${prNumber} [${prState}]`,
                  idList: pullRequestsListIdAndName.id,
                  pos: "top"
                }).then(card => {
                  window.Trello.post(`/card/${card.id}/attachments`, {
                    name: "github pull request",
                    url: pullRequestUrl
                  });
                });
              });
            });
        }
      }
    ];
  }
});
