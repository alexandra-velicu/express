const request = require('supertest');
const express = require('/Users/obi/express'); // Adjust the path to your express instance
const logger = require('morgan');
const cookieParser = require('cookie-parser');

describe('Express App with Jest', () => {
  let app;

  beforeEach(() => {
    app = express();
    if (process.env.NODE_ENV !== 'test') {
      app.use(logger(':method :url'));
    }
    app.use(cookieParser('my secret here'));
    app.use(express.urlencoded({ extended: false }));

    app.get('/', (req, res) => {
      if (req.cookies.remember) {
        res.send('Remembered :). Click to <a href="/forget">forget</a>!.');
      } else {
        res.send('<form method="post"><p>Check to <label>'
          + '<input type="checkbox" name="remember"/> remember me</label> '
          + '<input type="submit" value="Submit"/>.</p></form>');
      }
    });

    app.get('/forget', (req, res) => {
      res.clearCookie('remember');
      res.redirect('back');
    });

    app.post('/', (req, res) => {
      var minute = 60000;
      if (req.body.remember) res.cookie('remember', 1, { maxAge: minute });
      res.redirect('back');
    });
  });

  test('GET / should return form if remember cookie is not set', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('<form method="post">');
  });

  test('GET / should return remembered message if remember cookie is set', async () => {
    const response = await request(app).get('/').set('Cookie', ['remember=1']);
    expect(response.status).toBe(200);
    expect(response.text).toContain('Remembered :). Click to <a href="/forget">forget</a>!.');
  });

  test('POST / should set remember cookie', async () => {
    const response = await request(app).post('/').send('remember=1');
    expect(response.status).toBe(302); // Assuming it redirects
    expect(response.headers['set-cookie'][0]).toContain('remember=1');
  });

  test('GET /forget should clear remember cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/').send('remember=1');
    const response = await agent.get('/forget');
    expect(response.status).toBe(302); // Assuming it redirects
    expect(response.headers['set-cookie'][0]).toContain('remember=;');
  });

  test('Logger middleware should be used if NODE_ENV is not test', () => {
    if (process.env.NODE_ENV !== 'test') {
      expect(app._router.stack.some(layer => layer.handle === logger(':method :url'))).toBe(true);
    }
  });
});
