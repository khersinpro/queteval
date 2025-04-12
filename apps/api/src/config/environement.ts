export const environment = () => ({
  mongodb: {
    uri: process.env.MONGODB_URI as string,
  },
  mysql: {
    host: process.env.MYSQL_HOST as string,
    port: parseInt(process.env.MYSQL_PORT as string),
    username: process.env.MYSQL_USER as string,
    password: process.env.MYSQL_PASSWORD as string,
    database: process.env.MYSQL_DATABASE as string,
  },
});
