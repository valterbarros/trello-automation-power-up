import trelloAuth from './auth'

trelloAuth()

var t = TrelloPowerUp.iframe()

document.querySelector('#jsghselection').addEventListener('submit', (event) => {
  event.preventDefault()

  const ghToken = document.querySelector('#js_gh_token')
  const ghOwner = document.querySelector('#js_gh_owner')
  const ghRepository = document.querySelector('#js_gh_repository')

  return t.set('board', 'shared', 'github_user_info', { ghToken, ghOwner: { name: ghOwner, repository: ghRepository } })
  .then(function(){
    t.closePopup()
  })
})

// Like a popup constructor as soon as the pop up rendes on the screen it will be called
t.render(() => {
  t.sizeTo('#jsghselection').done()

  const ghToken = document.querySelector('#js_gh_token')
  const ghOwner = document.querySelector('#js_gh_owner')
  const ghRepository = document.querySelector('#js_gh_repository')

  t.get('board', 'shared', 'github_user_info').then((personalGithubData) => {
    ghToken.value = personalGithubData.ghToken
    ghOwner.value = personalGithubData.ghOwner.name
    ghRepository.value = personalGithubData.ghOwner.repository
  })
})