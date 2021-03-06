import auth from '../../GraphAuth';
import config from '../../../../config';
import commands from '../../commands';
import GlobalOptions from '../../../../GlobalOptions';
import {
  CommandOption, CommandValidate
} from '../../../../Command';
import GraphCommand from "../../GraphCommand";
import * as request from 'request-promise-native';
import Utils from '../../../../Utils';

const vorpal: Vorpal = require('../../../../vorpal-init');

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  teamId: string;
  channelId: string;
  messageId: string;
}

class GraphTeamsChannelMessageGetCommand extends GraphCommand {
  public get name(): string {
    return `${commands.TEAMS_CHANNEL_MESSAGE_GET}`;
  }

  public get description(): string {
    return 'Retrieves a message from a channel in a Microsoft Teams team';
  }

  public commandAction(cmd: CommandInstance, args: CommandArgs, cb: () => void): void {
    auth
      .ensureAccessToken(auth.service.resource, cmd, this.debug)
      .then((): request.RequestPromise => {
        const requestOptions: any = {
          url: `${auth.service.resource}/beta/teams/${args.options.teamId}/channels/${args.options.channelId}/messages/${args.options.messageId}`,
          headers: Utils.getRequestHeaders({
            authorization: `Bearer ${auth.service.accessToken}`,
            accept: 'application/json;odata.metadata=none'
          }),
          json: true
        };

        if (this.debug) {
          cmd.log('Executing web request...');
          cmd.log(requestOptions);
          cmd.log('');
        }

        return request.get(requestOptions);
      })
      .then((res: any): void => {
        if (this.debug) {
          cmd.log('Response:')
          cmd.log(res);
          cmd.log('');
        }

        cmd.log(res);
        if (this.verbose) {
          cmd.log(vorpal.chalk.green('DONE'));
        }
        cb();
      }, (err: any): void => this.handleRejectedODataJsonPromise(err, cmd, cb));
  }

  public options(): CommandOption[] {
    const options: CommandOption[] = [
      {
        option: '-i, --teamId <teamId>',
        description: 'The ID of the team where the channel is located'
      },
      {
        option: '-c, --channelId <channelId>',
        description: 'The ID of the channel that contains the message'
      },
      {
        option: '-m, --messageId <messageId>',
        description: 'The ID of the message to retrieve'
      }
    ];

    const parentOptions: CommandOption[] = super.options();
    return options.concat(parentOptions);
  }

  public validate(): CommandValidate {
    return (args: CommandArgs): boolean | string => {
      if (!args.options.teamId) {
        return 'Required parameter teamId missing';
      }

      if (!Utils.isValidGuid(args.options.teamId)) {
        return `${args.options.teamId} is not a valid GUID`;
      }

      if (!args.options.channelId) {
        return 'Required parameter channelId missing';
      }

      if (!args.options.messageId) {
        return 'Required parameter messageId missing';
      }

      return true;
    };
  }
  
  public commandHelp(args: {}, log: (help: string) => void): void {
    const chalk = vorpal.chalk;
    log(vorpal.find(this.name).helpInformation());
    log(
      `  ${chalk.yellow('Important:')} before using this command, log in to the Microsoft Graph
    using the ${chalk.blue(commands.LOGIN)} command.
          
  Remarks:

    ${chalk.yellow('Attention:')} This command is based on an API that is currently
    in preview and is subject to change once the API reached general
    availability.

    To retrieve a message from a Microsoft Teams channel, you have to first log
    in to the Microsoft Graph using the ${chalk.blue(commands.LOGIN)} command,
    eg. ${chalk.grey(`${config.delimiter} ${commands.LOGIN}`)}.

    You can only retrieve a message from a Microsoft Teams team if you are
    a member of that team.

  Examples:
  
    Retrieve the specified message from a channel of the Microsoft Teams team
      ${chalk.grey(config.delimiter)} ${this.name} --teamId 5f5d7b71-1161-44d8-bcc1-3da710eb4171 --channelId 19:88f7e66a8dfe42be92db19505ae912a8@thread.skype --messageId 1540747442203
`   );
  }
}

module.exports = new GraphTeamsChannelMessageGetCommand();