import App from './app';
import HealthRoute from './routes/health.route';
import AccountRoute from './routes/account.route';

const app = new App([new HealthRoute(), new AccountRoute()]);

app.listen();

export default app;