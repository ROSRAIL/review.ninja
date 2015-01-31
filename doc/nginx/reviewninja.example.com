upstream app_server {
    server 127.0.0.1:5000 fail_timeout=0;
}

server {
    listen 80;
    server_name reviewninja.example.com;
    server_tokens off; # don't show the version number, a security best practice

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;

        if (!-f $request_filename) {
            proxy_pass http://app_server;
            break;
        }
    }
}
