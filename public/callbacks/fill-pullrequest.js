export const fillPullrequestCallback = function(t) {
  let listBoardId = ''
  let usersFilter = [];

  const githubUserInfo = async t.get('board', 'shared', 'github_user_info')
  const githubToken = githubUserInfo.ghToken
  listBoardId = githubUserInfo.listBoardId
  usersFilter = githubUserInfo.usersFilter

  const { id: boardId } = await t.board('id');

  const repos = githubUserInfo.pullRequestRepoUrls.reduce((acc, curr) => {
    acc = acc + curr.match(/repos\/([a-z]\/a-z)\/pulls/)?.at(1);
  }, '');

  console.log(repos, boardId, usersFilter, listBoardId)

  const search = new URLSearchParams()
  search.set('users', usersFilter)
  search.set('board_id', boardId)
  search.set('list_id', listBoardId)
  search.set('repos', repos)
  fetch(`https://localhost:12769/sync_cards?${search}`)
}
