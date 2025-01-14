### Q: How do i generate a token for the playground?

A: When working with the GraphQL-API in the GraphQL-Playground (`http://localhost:4000/admin`), you are required to be authenticated. In order to do so, you have to create a session-token. You can do this in the following way:

Create the following query:

```
mutation login($email: String!, $password: String!) {
  createSession(email: $email, password: $password) {
    token
  }
}
```

Insert into the `query variables`-view the following variable-definition:

```
{"email": "dev@wepublish.ch", "password": "123"}
```

Hit the execute-button (that looks like a play-button). You should now see in the right part of the Playground an output that resembles the following:

```
{
  "data": {
    "createSession": {
      "token": "rDFQbOKDLIG2JhDS6RveuIS6rRF7176R"
    }
  }
}
```

Copy the token and switch to the `HTTP Headers`-view. Now paste your token into the following code:

```
{
  "authorization": "Bearer rDFQbOKDLIG2JhDS6RveuIS6rRF7176R"
}
```

As of now you’re good to go the execute queries/mutations in the GraphQL-Playground.

## Installation troubleshooting

### Q: While running `yarn install` I get the following error `The engine "node" is incompatible with this module. Expected version "^10.13.0 || ^12.13.0 || >=14.0.0". Got "12.0.0"`. What can I do?

A: Your local node environment is ahead (or behind) of wepublish.
As a workaround you can run `yarn install --ignore-engines`

The issue is related to https://github.com/wepublish/wepublish/issues/236

### Q: Installation (while running `yarn install`) fails because of `sharp` library (exit code 127)

A: You can solve it by running the following commands:

`rm -rf /Users/{username}/.npm/_libvips`

`brew install vips` (eventually install brew first: https://docs.brew.sh/Homebrew-on-Linux)

`rm -rf node_modules` => Within all packages!

`yarn install`

### Q: `Couldn't connect to Docker daemon` while running `yarn dev`

A: This may be caused by a permission misconfiguration in your docker installation.
You can solve it by running: `sudo chown $USER /var/run/docker.sock`

### Q: What do I do if I receive the error `P3009` in the terminal by Prisma?

A: You can solve this issue by resetting the database, running `npx prisma migrate reset`. This command will delete the current database and re-create it.

Now if you run `yarn dev` you'll get a fresh new database. and everything should be running again.

## Windows Specific Problem

### Q: What do I do if I'm using Windows and 'examples/media' doesn't run and I receive the error `Error: Cannot find module '../build/Release/magic'` in the terminal and I receive an error when trying to install this module?

A: If you are using Windows then run this command after checking that you can reach the “MSBuild.exe” file.
`npm config set msbuild_path "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe"`

Now you can go in the terminal to examples/media and run `yarn` and the magic module should be installed successfully.
