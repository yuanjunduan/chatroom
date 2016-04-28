import util from './util';

const socket = io();

const input = util.$('.input');
const send = util.$('.send');
const message = util.$('.message ul');
const inputname = util.$('.inputname');
const comfirm = util.$('.confirm');
const shade = util.$('#shade');
const userlist = util.$('.userlist');
const nums = util.$('.users .nums');
const upload = util.$('.upload');

inputname.focus();

const sendMsg = function(data, isMyself){
    var li = util.$c('li', {
        className: `chatitem ${isMyself ? 'myself' : 'others'}`
    });

    var time = util.$c('span', {
        className: 'time',
        textContent: `(${util.timeformat(data.time)})`
    });

    var username = util.$c('p', {
        className: 'username'
    });

    var text = document.createTextNode(data.username + (isMyself ? '-我' : ''));

    if(isMyself){
        username.appendChild(time);
        username.appendChild(text);
    }else{
        username.appendChild(text);
        username.appendChild(time);
    }

    var msg = util.$c('p', {
        className: 'msg',
        innerHTML: data.msg
    });

    li.appendChild(username);
    li.appendChild(msg);

    message.appendChild(li);
    li.scrollIntoView();
}

const initusers = function(id, users){
    userlist.innerHTML = '';
    var id = socket.id;

    users.forEach(function(user){
        var li = util.$c('li', {
            id: 'id' + user.id,
            textContent: user.username + (user.id === id ? '(我)' : '')
        });
        userlist.appendChild(li);
    });
}

const userJoin = function(username, id, users){
    var isMyself = socket.id === id;
    
    if(isMyself){
        shade.style.display = 'none';
        input.focus();
    }else if(!socket.isLogin){
        return;
    }

    initusers(id, users);

    nums.textContent = users.length;

    showTip(`${username} 加入群聊`, 'userjoin');
}

const userOut = function(id, username, length){
    var li = util.$('#id' + id);
    li.parentNode.removeChild(li);
    nums.textContent = length;

    showTip(`${username}退出群聊`, 'userout');
}

const showTip = function(msg, type){
    var li = util.$c('li', {
        className: `chatitem msgitem ${type}`,
        innerHTML: `<p class="msgcontent">${msg}</p>`
    });

    message.appendChild(li);

    li.scrollIntoView();
}

const inputing = function(id){
    inputing.wait = 1000;
    clearTimeout(inputing[id]);
    var li = util.$('#id' + id);

    if(!li.querySelector('.inputing')){
        li.appendChild(util.$c('span', {
            className: 'inputing',
            textContent: '（正在输入……）'
        }));
    }

    inputing[id] = setTimeout(function(){
        var inp = li.querySelector('.inputing');
        clearTimeout(inputing.st);
        inp.parentNode.removeChild(inp);
    }, inputing.wait);
}

const nameconflict = function(username){
    inputname.classList.add('conflict');
    inputname.setAttribute('placeholder', `昵称${username}已被占用`);
    inputname.value = '';
    shade.style.display = '';
    inputname.focus();
}

const loadImg = function(e){
    let fr = new FileReader();
    let img = e.target.files[0];

    if(!img)return;

    if(!/^image\/[a-z]+$/.test(img.type)){
        showTip('请选择图片', 'warning');
        return;
    }
    if(img.size > 1024 * 50){
        showTip('图片不得超过50k', 'warning');
        return;
    }

    fr.readAsDataURL(img);

    fr.onload = e => {
        input.innerHTML += `<img src=${e.target.result} />`;
        e.target.value = '';
    }
}

input.onkeydown = function(e){
    if(e.keyCode == 13){ 
        send.click();
        return false;
    }
}

inputname.onkeydown = function(e){
    e.keyCode == 13 && comfirm.click();
}

document.body.ontouchmove = function(){return false;}

socket.on('connect', function(){
    comfirm.onclick = function(){
        var username = inputname.value.replace(/\s/g, '');
        if(username){
            socket.emit('join', username, socket.id);
        }else{
            inputname.focus();
        }
    } 

    socket.on('conflict' + socket.id, nameconflict)

    socket.on('userjoin', function(username, id, users){

        userJoin(username, id, users);

        if(socket.id === id){
            socket.isLogin = true;

            socket.on('userout', userOut);

            socket.on('inputing', inputing);

            send.onclick = function(){
                var msg = input.innerHTML.trim();
                if(msg){
                    socket.emit('chat', msg);
                    input.innerHTML = '';
                }
            }

            input.oninput = function(){
                socket.emit('inputing');
                this.innerHTML = this.innerHTML.replace(/<[^img\s*][^>]*>/g, '') + '';
            }

            document.ondrop = function(e){
                let img = e.dataTransfer;

                e.target == input && loadImg({target: img});

                if(img.files.length > 0){
                    return false;
                }     
            }

            socket.on('chat', function(data){
                sendMsg(data, data.id === socket.id);
            });

            upload.onchange = loadImg;
        }
    }); 


})