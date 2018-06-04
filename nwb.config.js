module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'ReactContainertree',
      externals: {
        react: 'React'
      }
    }
  }
}
