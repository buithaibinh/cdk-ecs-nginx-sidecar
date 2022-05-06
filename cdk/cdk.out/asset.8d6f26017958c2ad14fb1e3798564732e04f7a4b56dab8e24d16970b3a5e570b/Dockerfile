FROM openresty/openresty:alpine

# Forward request logs to Docker log collector
# RUN ln -sf /dev/stdout /var/log/nginx/access.log \
# && ln -sf /dev/stderr /var/log/nginx/error.log

ADD default.conf /etc/nginx/conf.d/default.conf
