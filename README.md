
* Go to
```
https://console.cloud.google.com/
```
to create a new project (don't forget to **`public`** your project) and
 add Authorized redirect URIs:

```
https://developers.google.com/oauthplayground
```
 (without backslash at the end), then go to https://developers.google.com/oauthplayground to create a new OAuth 2.0 Client ID with permission: `https://www.googleapis.com/auth/drive` and `https://mail.google.com` then copy your `Refresh token` `Client ID` and `Client Secret` to `config.json` in part `credentials` -> `google`

* Go to https://www.google.com/recaptcha/admin/create to create a new reCAPTCHA v2 with `I'm not a robot checkbox`
* Add domain **`repl.co`** (not repl.com) to your reCAPTCHA v2
* Accept the reCAPTCHA v2 terms of service
* Then copy your `Site key` and `Secret key` to `config.json`
```
https://www.google.com/recaptcha/admin/create
```
* Go to https://betterstack.com/better-uptime or https://uptimerobot.com/ to create a new monitor for your project
```
https://betterstack.com/better-uptime
```


render dploy

build command
```bash
npm install && pip install -r requirements.txt
```
start command
```bash
node index.js
```
