module.exports = {
  safely(f) {
    try {
      return f();
    } catch(err) {
      console.log(err, err.stack);
      return this.error(err);
    }
  },
  error(error) {
    return {
      isError: true,
      error,
    };
  },
};
