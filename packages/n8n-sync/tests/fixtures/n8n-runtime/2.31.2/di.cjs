const services = new Map();

const Container = {
  get(token) {
    if (!services.has(token)) {
      throw new Error(`missing service ${String(token.description ?? token)}`);
    }
    return services.get(token);
  },
  set(token, value) {
    services.set(token, value);
  },
  reset() {
    services.clear();
  },
};

module.exports = { Container };
