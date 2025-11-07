import { define } from 'minicomp'


define('quoted-content', () => `
  <link rel="stylesheet" href="./client/design/layout/quoted-content/styles.css" />
  <div><slot></slot></div>
`)
