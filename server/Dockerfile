FROM library/node:12.2.0
# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable
# set working directory
WORKDIR /app
# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH
# install and cache app dependencies
#RUN npm install
RUN npm install typescript
#RUN npm run build --watch=false
#RUN ng e2e --port 3100
#RUN git config --global http.sslVerify false && git clone https://@gitlab.quadratyx.com/qtx-projects/timesheet.git /timesheet 
RUN cp -r /timesheet/server/* /app/ && rm -rf /timesheet && npm install && tsc -b tsconfig.json
RUN npm run build && cp -r build/* /app/ && cd /app/ 
CMD [ "node", "index.js" ]