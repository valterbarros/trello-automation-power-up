// Needed data:
// ghToken
// listBoardId
// usersFilter
// pullRequestRepoUrls
// skipPrName
// 

const formatDate = (date) => new Date(date).toLocaleString();

let labelsCache = [];

const getLabelId = async (boardId, query) => {
  const labels = labelsCache.length ? labelsCache : (await Trello.get(`/boards/${boardId}/labels`) || []);

  labelsCache = labels;

  return labels
    .map((l) => ({ name: l.name.replace(/^[^a-z]+/gi, '').toLowerCase(), id: l.id }))
    .find(({ name }) => name.includes(query.toLowerCase()))?.id;
}

const gitHubRequest = async (url, token) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`
    }
  });

  return await res.json();
}

export const fillPullrequestCallback = function(t) {
  let listBoardId = ''
  let usersFilter = [];

  t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
    const githubToken = githubUserInfo.ghToken
    // const pullRequestUrl = githubUserInfo.pullRequestUrl
    listBoardId = githubUserInfo.listBoardId
    usersFilter = githubUserInfo.usersFilter

    return Promise.all(githubUserInfo.pullRequestRepoUrls.map(async (pullRequestUrl) => {
      return await gitHubRequest(`${pullRequestUrl}?per_page=99`, githubToken);
    }))
  })
  .then((githubRepoPullRequests) => {
    //
    // Pull requests return
    //
    // [
    // [
    //     {
    //       html_url: 'asdas1dasd',
    //       id: 23123
    //     },
    //     {
    //       html_url: 'aswdasdasd',
    //       id: 343332
    //     }
    // ],
    // [
    //     {
    //       html_url: 'asdwasdasd',
    //       id: 44
    //     },
    //     {
    //       html_url: 'asdasd34asd',
    //       id: 34332
    //     }
    // ]
    // ]
    //

    const flattedRepoPullRequests = githubRepoPullRequests.reduce((acc, githubRepoPullRequest) => {
      return [...acc, ...githubRepoPullRequest]
    }, [])

    return Promise.all([
      flattedRepoPullRequests,
      t.get('board', 'shared', 'github_user_info')
    ])
  })
  .then(([githubPullRequests, githubUserInfo]) => {
    console.log(githubPullRequests);
    const allPrs = {}
    const allExistentPrs = Object.keys(githubUserInfo);

    // Get a list of created cards to remove in case of a error on set board shared data
    // currently that error could appear when you save a lot of prs on your trello's board
    // Unhandled rejection Error: PluginData length of 8192 characters exceeded. See:
    //
    const createdCardIds = [];

    const githubPullRequestsFiltered = githubPullRequests
      .filter((pullRequest) => {
        if ((githubUserInfo.skipPrName || '').length > 0){
          return !githubUserInfo.skipPrName.split(',').find((term) => {
            return pullRequest.title.indexOf(term) > 0;
          });
        } else {
          return true;
        }
      }).filter((pullRequest) => {      
        return usersFilter.includes(pullRequest.user.login)
      })

    const getRequestsMap = githubPullRequestsFiltered.map(async (pullRequest) => {
      const pullRequestUrl = pullRequest.html_url;

      // Check if pr is already tracked on a Trello's card
      if (!allExistentPrs.includes(pullRequestUrl)) {
        const pullRequestApiUrl = pullRequest.url;
        const userName = pullRequest.user.login;
        const updatedPr = pullRequest.updated_at;
        const splittedUrl = pullRequestUrl.split('/');
        const prNumber = splittedUrl[splittedUrl.length - 1];
        const cardTitle = pullRequest.title;
        const repoName = pullRequest.base.repo.name;
        const hasReadtyToReview = pullRequest.labels.find(({ name }) => name.includes('review'));

        const { additions } = await gitHubRequest(pullRequestApiUrl, githubUserInfo.ghToken);
        
        const { id: boardId } = await t.board('id');
        
        const userLabelId = await getLabelId(boardId, userName);
        const repoLabelId = await getLabelId(boardId, repoName);
        const readyToReviewLabelId = await getLabelId(boardId, 'ready to review');
        const idLabels = [userLabelId, repoLabelId].filter(Boolean);

        if (hasReadtyToReview && readyToReviewLabelId) idLabels.push(readyToReviewLabelId);

        const createCardParams = {
          name: `${cardTitle} [${repoName}] [${userName}] #${prNumber} [${formatDate(updatedPr)}] [a: ${additions}]`,
          idList: listBoardId,
          ...( idLabels.length && { idLabels: idLabels.join(',') }),
          pos: "top",
        };

        return window.Trello.post("/card", createCardParams).then(async (card) => {
          window.Trello.post(`/card/${card.id}/attachments`, {
            name: "github pull request",
            url: pullRequestUrl
          });

          return card
        })
        .then((card) => {
          createdCardIds.push(card.id);

          return window.Trello.post(`/card/${card.id}/attachments`, {
            name: "github pull request api",
            url: pullRequestApiUrl
          });
        })
        .then(() => {
          allPrs[pullRequestUrl] = true
        })
        .catch((err) => {
          console.log(err);
        })
      }

      return null;
    })

    Promise.all(getRequestsMap).then(() => {
      console.log(allPrs);
      return t.set('board', 'shared', allPrs);
    })
    .then(() => {
      t.get('board', 'shared').then((data) => {
        console.log(data);
      })
    })
    .catch((err) => {
      console.log(err);
      console.log('--- PANIC: starting removing the created cards prs ---');

      createdCardIds.forEach((cardId) => {
        console.log(`removed: ${cardId}`);
        window.Trello.delete(`/cards/${cardId}`);
      })
    })
  })
  .catch((err) => {
    console.log(err);
  })
  // End
}
