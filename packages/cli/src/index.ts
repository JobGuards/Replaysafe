#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import Conf from 'conf';
import ora from 'ora';
import axios from 'axios';

const config = new Conf({ projectName: 'stillup' });
const program = new Command();

const banner = `
  ${chalk.bold.hex('#BFFF00')('STILLUP SENTINEL')} ${chalk.dim('v1.0.0')}
  ${chalk.dim('The Infrastructure Safety Layer')}
`;

program
  .name('stillup')
  .description('Official StillUp Infrastructure Sentinel CLI')
  .version('1.0.0');

// --- LOGIN ---
program
  .command('login')
  .description('Authenticate with your StillUp API key')
  .argument('<apiKey>', 'Your StillUp API Key')
  .option('-u, --url <url>', 'StillUp API URL', 'http://localhost:4040')
  .action((apiKey: string, options: { url: string }) => {
    console.log(banner);
    const spinner = ora('Authenticating...').start();
    
    try {
      config.set('apiKey', apiKey);
      config.set('baseUrl', options.url);
      spinner.succeed(chalk.green('Successfully authenticated with StillUp Sentinel.'));
      console.log(chalk.dim(`  Config saved to: ${config.path}`));
    } catch (err) {
      spinner.fail('Failed to save configuration.');
    }
  });

// --- HEARTBEAT (HB) ---
program
  .command('hb')
  .description('Send a heartbeat ping to a monitor')
  .argument('<token>', 'Monitor heartbeat token')
  .option('-s, --status <status>', 'Heartbeat status (success|failure)', 'success')
  .option('-m, --message <message>', 'Attach a message to the heartbeat')
  .action(async (token: string, options: { status: string, message?: string }) => {
    const baseUrl = (config.get('baseUrl') as string) || 'http://localhost:4040';
    const spinner = ora(chalk.dim('Dispatching heartbeat pulse...')).start();
    
    try {
      const url = `${baseUrl}/hb/${token}`;
      await axios.get(url, {
        params: {
          status: options.status,
          msg: options.message
        }
      });
      spinner.succeed(chalk.hex('#BFFF00')('Sentinel Heartbeat Received.'));
    } catch (error: any) {
      spinner.fail(chalk.red(`Heartbeat failed: ${error.message}`));
      if (error.response) {
        console.log(chalk.dim(`  Server responded with: ${error.response.status} ${error.response.data?.error || ''}`));
      }
      process.exit(1);
    }
  });

// --- GUARD ---
const guard = program.command('guard').description('ReplayGuard management commands');

guard
  .command('status')
  .description('Check status of a guarded execution')
  .argument('<executionId>', 'Execution ID to check')
  .action(async (executionId: string) => {
    const baseUrl = (config.get('baseUrl') as string) || 'http://localhost:4040';
    const apiKey = config.get('apiKey');
    
    if (!apiKey) {
      console.log(chalk.red('Error: Please run `stillup login <apiKey>` first.'));
      return;
    }

    const spinner = ora('Fetching execution details...').start();
    try {
      const res = await axios.get(`${baseUrl}/api/guards/${executionId}`, {
        headers: { 'x-api-key': apiKey as string }
      });
      spinner.stop();
      
      const exe = res.data;
      console.log(chalk.bold(`\n  Execution: ${exe.id}`));
      console.log(`  Monitor:   ${chalk.cyan(exe.monitor.name)}`);
      console.log(`  Status:    ${exe.status === 'SUCCESS' ? chalk.green('SUCCESS') : chalk.red(exe.status)}`);
      console.log(`  Attempt:   ${exe.attempt}`);
      console.log(`  Effects:   ${exe.sideEffects.length} guarded\n`);
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to fetch status: ${error.message}`));
    }
  });

// --- WHOAMI ---
program
  .command('whoami')
  .description('Display the current authentication status')
  .action(() => {
    const apiKey = config.get('apiKey');
    const baseUrl = config.get('baseUrl');
    
    if (!apiKey) {
      console.log(chalk.yellow('Not authenticated. Run `stillup login <apiKey>`'));
    } else {
      console.log(chalk.bold('StillUp Sentinel CLI'));
      console.log(`  API Key: ${chalk.dim('****' + (apiKey as string).slice(-4))}`);
      console.log(`  Base URL: ${chalk.cyan(baseUrl)}`);
    }
  });

// --- TUNNEL ---
const tunnel = program.command('tunnel').description('Tunnelight infrastructure monitoring');

tunnel
  .command('monitor')
  .description('Start monitoring a secure tunnel (latency + handshake)')
  .argument('<token>', 'Heartbeat token for this tunnel')
  .option('-t, --target <target>', 'Target host to monitor latency', '8.8.8.8')
  .option('-i, --interval <seconds>', 'Monitoring interval in seconds', '60')
  .action(async (token: string, options: { target: string, interval: string }) => {
    const baseUrl = (config.get('baseUrl') as string) || 'http://localhost:4040';
    console.log(banner);
    console.log(chalk.bold('🛰️  Tunnelight Engine Active'));
    console.log(chalk.dim(`  Target:   ${options.target}`));
    console.log(chalk.dim(`  Interval: ${options.interval}s\n`));

    const intervalMs = parseInt(options.interval) * 1000;

    const tick = async () => {
      const spinner = ora(chalk.dim(`Pulsing ${options.target}...`)).start();
      const startTime = Date.now();
      
      try {
        // Simple latency check via axios (HEAD request)
        await axios.head(`http://${options.target}`, { timeout: 5000 }).catch(() => {
          // If HTTP fails, we just measure the time it took to fail/succeed
        });
        
        const latency = Date.now() - startTime;
        
        await axios.post(`${baseUrl}/hb/${token}`, {
          type: 'SUCCESS',
          latency: latency,
          output: `Tunnelight latency check to ${options.target}`
        });

        spinner.succeed(chalk.hex('#BFFF00')(`Pulse Sent (Latency: ${latency}ms)`));
      } catch (error: any) {
        spinner.fail(chalk.red(`Pulse failed: ${error.message}`));
      }
    };

    tick();
    setInterval(tick, intervalMs);
  });

program.parse();
