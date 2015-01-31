# Webhooks

This guide will detail which GitHub webhooks ReviewNinja uses to trigger actions, what those actions are, 
and how you may test these webhooks locally.

## General

A webhook is added to a repo in one of two ways:

1. a user with admin access adds ReviewNinja to his repos
2. a user with admin access clicks on the 'add webhook' button

This webhook looks like this:
```
http://app.review.ninja/github/webhook/:id
```

Where id is the ReviewNinja id of the user who added the webhook. This id is used later to retrieve the 
necessary credentials in order to perform administrative 
tasks (such as updating the PR status) when the webhook is activated.

## Utilized actions

### Pull request

- opened: udpate the status, send notification emails, add badge comment
- synchronize: udpate the status, send notification emails, send websocket to clients
- closed: close the associated milestone, send websocket to clients

### Issues

- opened: udpate the status, send notification emails
- closed: udpate the status, send notification emails

### Issue comment

- created: send websocket to clients

## How to test locally

The grunt http task has been configured to allow flexible local testing of these webhooks. These can be triggered by running:
```
grunt http:<github-event> --action=<github-action>  --id=<reviewninja-user-id>
```

Where github event and action is one of:

- pull_request (actions: closed, opened, reopened, synchronize)
- issues (actions: closed, opened, reopened)
- issue_comment (actions: created)

An example command to mock a pull_request:closed action:
```
grunt http:pull_request --action=closed --id=8767asfdas6786df7d --sender=dfarr --number=43 --user=reviewninja --repo=foo --repo_uuid=23588185
```

Notes:

- the user id (id) can be retrieved from your mongo instance
- you can quickly grab the repo_uuid from ``https://api.github.com/repos/:user/:repo``
