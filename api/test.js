module.exports = (req, res) => {
  res.status(200).json({
    status: 'OK',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      DATABASE_URL_DEFINED: !!process.env.DATABASE_URL,
      DATABASE_URL_START: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : null
    }
  });
};
