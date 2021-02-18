import mysql from 'mysql';
import store from './serverConfig'
const { consoleLog, serverLog } = require('./logs/createLogger')

var pool = mysql.createPool(store.testDatabase);

pool.getConnection(function (err: any, connection: any) {
  if (err) {
      serverLog.error("In database.ts ",err)
      console.error("DB error: ",err)
  }
  else {                
      connection.beginTransaction(function (err: any) {
          if (err) {
              serverLog.error('In database.ts DB error connecting: ' + err.message);
              console.error('DB error connecting: ' + err.message);
          } else {
              serverLog.info('In database.ts DB connected');
              console.log('DB connected');
              connection.release();
          }
      });
  }
});

export default pool;
