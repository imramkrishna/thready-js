#!/usr/bin/env node

import { init } from "./workerTemplates.js";
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    init();
    break;
  default:
    console.log('Thready CLI');
    console.log('');
    console.log('Usage:');
    console.log('  npx thready init  - Initialize Thready in your project');
    break;
}