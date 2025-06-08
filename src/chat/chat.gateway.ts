import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {Socket, Server } from 'socket.io'

@WebSocketGateway(2000, {cors: {origin: '*'}})
export class ChatGateWay implements OnGatewayConnection, OnGatewayDisconnect{
    @WebSocketServer() server : Server;
    handleDisconnect(client: Socket) {
        console.log('new user connected', client.id);
        client.broadcast.emit('user joint', { message : `new user joint the chat ${client.id}`})

    }
    handleConnection(client: Socket) {
        console.log('user diconnected', client.id)
        this.server.emit('user left', {message : `user left the chat ${client.id}`})
    }

    

    // @SubscribeMessage('message')
    // handleNewMessage(clinet: Socket, message : any){
    //     console.log(message);

    //     clinet.emit('reply', 'this is a replay from server')
    //     this.server.emit('reply', 'this is broadcasting...')
    // }
    

}