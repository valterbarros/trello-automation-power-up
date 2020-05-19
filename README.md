# Automatizations Trello Power-Up 🚀

# instructions

You need to serve that app to use on your trello boards, for that there is a node script server.js on the project root you could run that using:

```
npm run start
```

That will only work for local tests to use on trello you need to use a host like AWS, digital ocean, heroku, etc.

After that you need to access that page to enable custom power up on trello:

https://trello.com/power-ups/admin

More about that process here https://tech.trello.com/power-up-tutorial-part-one/

On the code you need to put your github token and your pull requests api link

client.js:134

```
const pullRequestsUrl =
  "<project pull requests url goes here ex: https://api.github.com/repos/:owner/:repo/pulls more about https://developer.github.com/v3/pulls/>";
const getPullRequests = fetch(pullRequestsUrl, {
  headers: {
    Authorization: "token <your github token goes here more about that https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line>"
  }
});
```

The sync pull requests button

![sync button](https://trello-attachments.s3.amazonaws.com/5d4605087c3bad4b6615b7f0/5d4605087c3bad4b6615b808/5a531e6cb8e44c1165f4ff80c53df611/image.png)
