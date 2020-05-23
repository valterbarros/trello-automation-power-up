/* global TrelloPowerUp */
import trelloAuth from './auth'

trelloAuth()

var t = TrelloPowerUp.iframe()

document.querySelector('#jsghselection').addEventListener('submit', (event) => {
  event.preventDefault()

  const ghToken = document.querySelector('#js_gh_token').value
  const pullRequestUrl = document.querySelector('#js_gh_repository')
  const listBoardName = document.querySelector('#js_gh_board_list')

  return t.set('board', 'shared', 'github_user_info', {
    ghToken,
    pullRequestUrl: pullRequestUrl.value,
    listBoardName: listBoardName.value
  })
  .then(() => {
    t.closePopup()
  })
})

// Like a popup constructor as soon as the pop up rendes on the screen it will be called
t.render(() => {
  t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
    const githubToken = githubUserInfo.ghToken

    const reposUrl = `https://api.github.com/user/repos?sort=pushed&per_page=20`

    return fetch(reposUrl, {
      headers: {
        Authorization: `token ${githubToken}`
      }
    })
    .then((reposResponse) => reposResponse.json())
    .then((repos) => {
      repos.forEach((repo) => {
        const option = document.createElement('option');
        option.text = repo.full_name
        option.value = repo.pulls_url.replace(/\{\/number\}/gu, '')

        const repoSelect = document.querySelector('#js_gh_repository')
        repoSelect.add(option)
      })
    })
    .then(() => {
      document.querySelector('#js_gh_repository').value = githubUserInfo.pullRequestUrl
    })
  })
  .then((result) => {
    console.log(result);
  })

  const ghToken = document.querySelector('#js_gh_token')
  const pullRequestUrl = document.querySelector('#js_gh_repository')
  const listBoardName = document.querySelector('#js_gh_board_list')

  t.get('board', 'shared', 'github_user_info').then((personalGithubData) => {
    console.log(personalGithubData)
    ghToken.value = personalGithubData.ghToken
    pullRequestUrl.value = personalGithubData.pullRequestUrl
    listBoardName.value = personalGithubData.listBoardName
  })
  .then(() => {
    t.sizeTo('#jsghselection').done()
  })
})
