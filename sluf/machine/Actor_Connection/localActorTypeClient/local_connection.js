
const net =require('net')
var http = require('http');

/**
 * @brief LocalActor_Connection
 *       this class let the machine start listening to connections from the external local actor which is going to send the data (it depends on the connection type given in the configuration file)
 * 
 */


class LocalActor_Connection{
    constructor(connectionType,config_file, eventEmitter,myIP,streaming){
        this.config_file= config_file
        this.connectionType = connectionType
        this.eventEmitter = eventEmitter
        this.localsocket
        this.myIP=myIP
        this.applie_Connection()
        this.streaming =streaming
        

    }
    applie_Connection(){
        if(this.connectionType == "TCP_Size"){this.TCP_connection(this.config_file.TCP_SizeBytes,"Size")}
        else if (this.connectionType == "TCP_Timer"){this.TCP_connection(this.config_file.TCP_Timer_InMS,"Timer")}
        else{this.http_connection()}
    }
    TCP_connection(rule,rule_type){ 
        var data_buffer=''

        var server= net.createServer(function(socket){
            socket.on('data',(data)=> {
                
                data_buffer += data 
                if(rule_type== 'Size'){
                    if(data_buffer.length > rule){
                         server.emit('LocalActor_data',([data_buffer.slice(0,rule+1),socket]))
                        data_buffer= data_buffer.slice(rule+1)

                    }
                }
                else{  
                    setTimeout(() => {
                        server.emit('LocalActor_data',([data_buffer,socket]))
                        data_buffer=''
                    }, rule);
                }
            
            })
            
            socket.on('error',(e)=>{console.log('error in localMachineServer s socket')})
        })
        server.on('LocalActor_data',([data,socket])=>{
            this.localsocket = socket
            let event_title = (this.streaming == false) ? "LocalActor_data": "Stream_Actor_data";
            this.eventEmitter.emit(event_title,data)})
        server.listen(5000,this.myIP,()=>{console.log('server is listening on Port 5000 ')});
    }
   
    http_connection(){
        var server = http.createServer((req,res)=>{
            this.localsocket = res
            var data=''
            req.on('data',(chunk)=>{
                data+=chunk
            })
            req.on('end',()=>{
                this.eventEmitter.emit('LocalActor_data',data)
            })
        })
        server.listen(this.config_file.LocalActorPort,this.myIP,()=>{console.log('server is listening on http://'+ this.myIP+':5000/')});
    }
}

module.exports= LocalActor_Connection