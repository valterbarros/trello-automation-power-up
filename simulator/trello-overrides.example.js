// File used to run tests locally without having to use inside a power-up context
export const trelloObj = {
  async get() {
    return {
      ghToken: '',
      listBoardId: '',
      usersFilter: [],
      pullRequestRepoUrls: [],
      skipPrName: '',
    };
  },
  async board() {
    return {
      id: '',
      name: '',
    };
  }
}

window.Trello = {
  async get(url) {
    const key = '';
    const token = '';
    const res = await fetch(`https://api.trello.com/1${url}?key=${key}&token=${token}`);
    const data = await res.json();

    return data;
  }
}
