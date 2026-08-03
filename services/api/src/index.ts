import { createServer } from "./server";

const PORT = Number(process.env.PORT ?? 3000);
const app = createServer();

app.listen(PORT, () => {
  console.log(`medlink-api listening on port ${PORT}`);
});
