/* global TrelloPowerUp */
import trelloAuth from './auth'

trelloAuth()

var t = TrelloPowerUp.iframe()

/* eslint-disable max-params */
function mountSelectOptions(collection, selectSelector, displayKey, valueKey) {
  collection.forEach((item) => {
    const option = document.createElement('option');
    option.text = item[displayKey]
    option.value = item[valueKey]

    const selectElement = document.querySelector(selectSelector)
    selectElement.add(option)
  })
}

function getSelectMultiple(query) {
  const opts = Array.from(document.querySelectorAll(`${query} option`))
  const selectedOptions = opts.filter(option => option.selected)
  const values = selectedOptions.map((optionElement) => {
    return optionElement.value
  })
  return values
}

document.querySelector('#jsghselection').addEventListener('submit', (event) => {
  event.preventDefault()

  const ghToken = document.querySelector('#js_gh_token').value

  /* get multiple select options */
  const repoOptions = Array.from(document.querySelectorAll('#js_gh_repository option'))
  const selectedOptions = repoOptions.filter(option => option.selected)
  const pullRequestRepoUrls = selectedOptions.map((optionElement) => {
    return optionElement.value
  })
  /* get multiple select options */

  /* get multiple select options */
  const usersFilter = getSelectMultiple('#js_users_filter')
  /* get multiple select options */

  const listBoardId = document.querySelector('#js_gh_board_list')
  const skipPrName = document.querySelector('#js_skip_name')

  return t.set('board', 'shared', 'github_user_info', {
    ghToken,
    pullRequestRepoUrls,
    listBoardId: listBoardId.value,
    skipPrName: skipPrName.value,
    usersFilter
  })
  .then(() => {
    t.closePopup()
  })
})

// Like a popup constructor as soon as the pop up rendes on the screen it will be called
t.render(() => {
  t.get('board', 'shared', 'github_user_info').then((githubUserInfo) => {
    const githubToken = githubUserInfo.ghToken

    t.board('id').then((board) => {
      return window.Trello.get(`/boards/${board.id}/lists`)
      .then((lists) => {
        mountSelectOptions(lists, '#js_gh_board_list', 'name', 'id')
      })
      .catch((err) => {
        console.log(err);
      })
    })
    .then(() => {
      document.querySelector('#js_gh_board_list').value = githubUserInfo.listBoardId
    })
    .catch((err) => {
      console.log(err);
    })

    const reposUrl = `https://api.github.com/user/repos?sort=pushed&per_page=20`

    return fetch(reposUrl, {
      headers: {
        Authorization: `token ${githubToken}`
      }
    })
    .then((reposResponse) => reposResponse.json())
    .then((repos) => {
      const mapRepo = repos.map((repo) => {
        return {
          fullName: repo.full_name,
          pullUrl: repo.pulls_url.replace(/\{\/number\}/gu, '')
        }
      })

      console.log(mapRepo);

      mountSelectOptions(mapRepo, '#js_gh_repository', 'fullName', 'pullUrl')
    })
    .then(() => {

      /* set multiple select options*/
      const repoSelectOptions = Array.from(document.querySelectorAll('#js_gh_repository option'));

      repoSelectOptions.forEach((option) => {

        if (githubUserInfo.pullRequestRepoUrls.includes(option.value)) {
          option.selected = true
        }
      })
      /* set multiple select options*/
    })
    .then(() => {
      // const users = {
      //   frontend: [
      //     'valterbarros',
      //     'franciscoemanuel',
      //     'antnathan',
      //     'victordantasmcz',
      //     'galvclicksign',
      //     'eaebob',
      //     'vsanrocha',
      //     'kahpereira',
      //     'Hai-San',
      //     'obssousa',
      //     'ViniciusTOG',
      //     'edumudu',
      //   ],
      //   backend: [
      //     'VinyLimaZ',
      //     'lsantosc',
      //     'eduardoazevedo3',
      //     'fabiodallazen',
      //     'deyvin',
      //     'tofoli'
      //   ]
      // }

      const frontendUsers = [
        'valterbarros',
        'franciscoemanuel',
        'antnathan',
        'victordantasmcz',
        'eaebob',
        'Hai-San',
        'vtdog',
        'laerciodev',
        'elianbatista',
        'giovanibl',
        'dependabot[bot]',
      ].map(name => ({ name }) )

      const backendUsers = [
        'lsantosc',
        'fabiodallazen',
        'tofoli',
        'vitorbribas'
      ].map(name => ({ name }) )

      mountSelectOptions(frontendUsers, '#js_users_filter', 'name', 'name');
      const frontOpts = document.querySelectorAll('#js_users_filter option');
      const wrapper = document.createElement('optgroup');
      wrapper.label = 'Frontend Developer';
      frontOpts.forEach((item) => wrapper.append(item))

      mountSelectOptions(backendUsers, '#js_users_filter', 'name', 'name');
      const backendOpts = document.querySelectorAll('#js_users_filter option');
      const backWrapper = document.createElement('optgroup');
      backWrapper.label = 'Backend Developer';
      backendOpts.forEach((item) => backWrapper.append(item))

      document.querySelector('#js_users_filter').innerHTML = '';
      document.querySelector('#js_users_filter').append(wrapper);
      document.querySelector('#js_users_filter').append(backWrapper);

      const opts = Array.from(document.querySelectorAll('#js_users_filter option'));

      opts.forEach((option) => {
        if (githubUserInfo.usersFilter.includes(option.value)) {
          option.selected = true
        }
      })
    })
  })
  .then((result) => {
    console.log(result);
  })

  const ghToken = document.querySelector('#js_gh_token')
  const listBoardId = document.querySelector('#js_gh_board_list')
  const skipPrName = document.querySelector('#js_skip_name')

  t.get('board', 'shared', 'github_user_info').then((personalGithubData) => {
    console.log(personalGithubData)
    ghToken.value = personalGithubData.ghToken
    listBoardId.value = personalGithubData.listBoardId
    skipPrName.value = personalGithubData.skipPrName
  })
  .then(() => {
    t.sizeTo('#jsghselection').done()
  })
})
