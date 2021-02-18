FROM nginx:1.16.0-alpine

# copy artifact build from the 'build environment'
ADD /opt/Timesheet/client/timesheet /usr/share/nginx/html

# expose port 80
#EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
