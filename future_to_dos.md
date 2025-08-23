following steps to do:

auth sirasinda gozuken icerik duzenlemesi

In firebase authentication page : set 
3. Set up Email Templates
Still in the Authentication section:
Click on the Templates tab
Configure these templates:
Email Verification:
Click on Email address verification
Customize the email subject and body
Make sure the action URL points to your domain
Example action URL: https://yourdomain.com/auth/email-verified
------
sign in olduktan sonra dashboard acces olmuyordu, 2 yontem onerdi, birinciyi yapti, ikinci daha mi guvenli olurdu? 

Making the dashboard client-side rendered (easier fix)
Adding a client-side authentication check that sends the Firebase token to the server
Let me implement the first approach by making the dashboard client-side rendered:
------
log out yapinca ana sayfaya yonlendirsin
------
credit sisteminde baslangicta 50 ile basliyor
------
develover console dan email credit vs gozukuyor

Explicitly exclude sensitive data via design

Store secrets outside the users doc, perhaps only in {uid}/settings-private that’s only accessible via callable functions.
------
