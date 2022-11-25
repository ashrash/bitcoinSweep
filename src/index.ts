import App from './app';
import HealthRoute from './routes/health.route';

const app = new App([new HealthRoute()]);

app.listen();

export default app;