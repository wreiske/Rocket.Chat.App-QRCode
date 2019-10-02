import { IHttp, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { MessageActionType } from '@rocket.chat/apps-engine/definition/messages/MessageActionType';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {Buffer} from 'buffer';

export class QRCodeCommand implements ISlashCommand {
    public command: string = 'qrcode';
    public i18nParamsExample: string = 'Slash_Command_Params_Example';
    public i18nDescription: string = 'Slash_Command_Description';
    public providesPreview: boolean = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
        const messageSender = await read.getUserReader().getById(context.getSender().id);
        const icon = await read.getEnvironmentReader().getSettings().getValueById('qrcode_icon');
        const username = await read.getEnvironmentReader().getSettings().getValueById('qrcode_name');

        if (context.getArguments().length === 0) {
            const builderError = modify.getCreator().startMessage()
                .setSender(/* botUser || */ context.getSender()).setRoom(context.getRoom())
                .setText(
                    `Please specify what you want your QR code to contain.

                    *For Example:*
                    /qrcode https://rocketbooster.net
                    /qrcode smsto:+1123456:This QR code app is sweet!
                    /qrcode tel:+1123456
                    /qrcode MATMSG:TO:email@example.com;SUB:A subject;BODY:your message;;`).setUsernameAlias(username).setAvatarUrl(icon);
            await modify.getNotifier().notifyUser(context.getSender(), builderError.getMessage());
            return;
        }

        const qrImage: IMessageAttachment = {
            text: `Scan this QR Code with your mobile phone or tablet.`,
            author: {
                name: 'Powered By RocketBooster',
                link: 'https://rocketbooster.net',
            },
            imageUrl: `https://apps.rocketbooster.net/api/qr/${new Buffer(context.getArguments().join(' ')).toString('base64')}`,
        };
        const builder = modify.getCreator()
            .startMessage()
            .setText(`@${messageSender.username} created a QR Code containing: ${context.getArguments().join(' ')}`)
            .setSender(/* botUser || */ context.getSender()).setRoom(context.getRoom())
            .setUsernameAlias(username).setAvatarUrl(icon).setAttachments([qrImage]);

        await modify.getCreator().finish(builder);

    }
}
