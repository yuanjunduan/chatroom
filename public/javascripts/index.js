import util from './util';
/*import '../stylesheets/fonticon';
import '../stylesheets/style';*/

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
const uploadForm = util.$('.upload-form');
const sendpic = util.$('.send-img');
const heart = util.$('.heart');
const heartDialog = util.$('.heart-dialog');
const PICS = JSON.parse(localStorage.getItem('pics')||0) || [];
const picBox = util.$('.pics-box');
const heartPic = util.$('.heart-pics');
const myhead = util.$('.myself-info .head');
const myname = util.$('.myself-info .name');

let prevTarget = '';//上次的聊天窗口
let currentTarget = 'hall';//默认当前窗口是大厅
let messages = {};//各个窗口聊天信息的数据

inputname.focus();

const heartImg = function(pics){
    [/*...pics, ...pics, ...pics,*/ ...pics].forEach(pic => {
        let div = util.$c('div', {
            className: 'heart-item'
        });

        let img = util.$c('img', {
            className: 'heart-img',
            src: pic
        });

        let del = util.$c('div', {
            className: 'del-img',
            innerHTML: '×',
            title: '删除'
        });

        del.pic = pic;

        div.appendChild(del);
        div.appendChild(img);
        picBox.appendChild(div);
    });
}

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

   /* var msg = util.$c('p', {
        className: 'msg',
        innerHTML: util.decompress(data.msg)
    });

    li.appendChild(username);
    li.appendChild(msg);

    message.appendChild(li);
    li.scrollIntoView();*/
    util.decompress(data.msg, function(str){
        var msg = util.$c('p', {
            className: 'msg',
            innerHTML: str
        });

        li.appendChild(username);
        li.appendChild(msg);

        message.appendChild(li);
        li.scrollIntoView(false);
    });
}

const initusers = function(id, users){
    userlist.innerHTML = '';
    var id = socket.id;

    users.forEach(function(user){
        var li = util.$c('li', {
            id: 'id' + user.id,
            className: 'user-item',
            textContent: user.username + (user.id === id ? '(我)' : '')
        });
        
        userlist.appendChild(li);
    });
}

const userJoin = function(username, id, users){
    var isMyself = socket.id === id;
    
    if(isMyself){
        shade.style.display = 'none';
        myname.textContent = username;
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
    inputing.wait = 1500;
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

const insertCont = function(cont, type){

    let range = document.createRange();

    let selection = window.getSelection();

    let target = selection.anchorNode;
    //console.log(cont, target);
    if(!target || (target !== input && target.parentNode !== input))return;

    let start = selection.anchorOffset;
    let end  = selection.focusOffset;
    

    let delta = 0;
    let cursor = 0;

    //cont = cont.replace(/(\r|\n|\r\n){1,2}/g, '<br/>');

    if(target === input){
        let node = type === 'text' ? document.createTextNode(cont) : util.$c('img', {className: 'pic', src: cont});
        //console.log(target.childNodes[start]);
        target.insertBefore(node, target.childNodes[start]);
        cursor = start + 1;
    }else{
        if(type === 'text'){
            let content = target.textContent;
            target.textContent = content.slice(0, start + delta) + cont + content.slice(end + delta);
            cursor = start + cont.length;
        }else{
            let img = util.$c('img', {className: 'pic', src: cont});
            let text1 = document.createTextNode(target.textContent.slice(0, start));
            let text2 = document.createTextNode(target.textContent.slice(end));
            let frag = document.createDocumentFragment();

            frag.appendChild(text1);
            frag.appendChild(img);
            frag.appendChild(text2);

            target.parentNode.replaceChild(frag, target);

            cursor = [...input.childNodes].findIndex(item => item === img) + 1;
            target = input;
        }
    }

    //console.log('target=', target.nodeName, 'cursor=', cursor);
    range.setStart(target, cursor);
    selection.removeAllRanges();
    selection.addRange(range);
}

const loadImg = function(img, isPaste){
    if(img && /^image\/[a-z]+$/.test(img.type)){
        if(img.size <= 0)return;

        let maxsize = 100;

        if(img.size > 1024 * maxsize){
            showTip(`图片不得超过${maxsize}k`, 'warning');
            return;
        }

        let fr = new FileReader;

        fr.onload = function(e){
            isPaste ? insertCont(e.target.result) : dropInsert(e.target.result);
        }

        fr.readAsDataURL(img);
    }
}

const dropInsert = function(str){
    let range = document.createRange();
    let sel = window.getSelection();

    input.innerHTML += /^data:image\/[a-z]+;base64/.test(str) ?
        `<img class='pic' src=${str}>` : str;

    range.setStart(input, input.childNodes.length);
    sel.removeAllRanges();
    sel.addRange(range);
}

socket.on('connect', function(){
    comfirm.addEventListener('click', function(){
        let username = inputname.value.replace(/\s/g, '');
        if(username){
            socket.emit('join', username, socket.id);
        }else{
            inputname.focus();
        }
    })

    inputname.addEventListener('keydown', function(e){
        e.keyCode == 13 && comfirm.click();
    });

    socket.on('conflict' + socket.id, nameconflict)

    socket.on('userjoin', function(username, id, users){

        userJoin(username, id, users);

        if(socket.id === id){
            socket.isLogin = true;

            heartImg(PICS);

            socket.on('userout', userOut);

            socket.on('inputing', inputing);

            send.addEventListener('click', function(e){
                let msg = input.innerHTML.trim();
                if(msg){
                    /*socket.emit('chat', util.compress(msg));
                    input.innerHTML = '';*/
                    util.compress(msg, function(str){
                        socket.emit(currentTarget == 'hall' ? 'chat' : 'private', str);
                        input.innerHTML = '';
                    });
                }
            });

            input.addEventListener('input', function(e){
                if(this.isinputing)return;

                this.isinputing = true;

                socket.emit('inputing');

                this.st = setTimeout(() => {
                    clearTimeout(this.st);
                    this.isinputing = false;
                }, 1200);
            });

            input.addEventListener('keydown', function(e){
                if(e.keyCode == 13 && !e.ctrlKey){
                    send.click();
                    e.preventDefault();
                }
            });

            input.addEventListener('drop', function(e){
                let data = e.dataTransfer;

                [...data.items].forEach(item => {
                    let type = item.type;
                    if(type.match(/^image\//)){
                        loadImg(item.getAsFile());
                    }else if(type === 'text/plain'){
                        item.getAsString(dropInsert);
                    }
                });

                e.preventDefault();
            });

            input.addEventListener('paste', function(e){
                let data = e.clipboardData;

                [...data.items].forEach(item => {
                    let type = item.type;
                    if(type.match(/^image\//)){
                        loadImg(item.getAsFile(), true);
                    }else if(type === 'text/plain'){
                        item.getAsString(str => {
                            insertCont(str, 'text')
                        });
                    }
                });

                e.preventDefault();
            });

            sendpic.addEventListener('click', function(e){
                upload.click();
            });

            socket.on('chat', function(data){
                sendMsg(data, data.id === socket.id);
            });

            socket.on('private', function(data){
                sendMsg(data, data.id === socket.id);
            });

            upload.addEventListener('change', function(e){
                let img = this.files[0];

                if(!img) return;

                if(/^image\/[a-z]+$/.test(img.type)){
                    loadImg(this.files[0]);
                }else{
                    showTip('请选择图片', 'warning');
                }
                
                uploadForm.reset();
            });
            

            document.addEventListener('contextmenu', function(e){
                if(e.target.className === 'pic'){
                    Object.assign(heartDialog.style, {
                        top: `${e.pageY}px`,
                        left: `${e.pageX}px`,
                        display: 'block'
                    });

                    heartDialog.pic = e.target.src;
                    e.preventDefault();
                }
            });

            heartDialog.addEventListener('click', function(e){
                if(PICS.find(p => p == this.pic)){
                    showTip('该图已收藏', 'warning');
                }else{
                    PICS.push(this.pic);

                    heartImg([this.pic]);
                    
                    localStorage.setItem('pics', JSON.stringify(PICS));
                }
                this.style.display = 'none';
            });

            heart.addEventListener('click', function(e){
                if(this.open){
                    heartPic.style.display = 'none';
                }else{
                    heartPic.style.display = 'block';
                }
                this.open = !this.open; 
            });

            picBox.addEventListener('click', function(e){
                let target = e.target;
                if(/^heart-img$|^heart-item$/.test(target.className)){
    
                    let src = target.className === 'heart-item' ? 
                        target.childNodes[0].src : target.src;

                    dropInsert(src);

                    heart.open = false;
                    heartPic.style.display = 'none';
                }else if('del-img' === target.className){
                    let index = PICS.findIndex(pic => pic === target.pic);

                    picBox.removeChild(picBox.childNodes[index]);
                    PICS.splice(index, 1);

                    localStorage.setItem('pics', JSON.stringify(PICS));
                }
            });

            document.addEventListener('click', function(e){
                let heartPicPos = heartPic.getBoundingClientRect();
                let heartPos = heart.getBoundingClientRect();
                let heartDialogPos = heartDialog.getBoundingClientRect();

                let x = e.pageX;
                let y = e.pageY;

                if(util.isOutside(x, y, heartPicPos) && util.isOutside(x, y, heartPos)){
                    heart.open = false;
                    heartPic.style.display = 'none';
                }
                if(util.isOutside(x, y, heartDialogPos)){
                    heartDialog.style.display = 'none';
                }
            });

            userlist.addEventListener('click', function(e){
                if(e.target.className !== 'user-item')return;

                currentTarget = e.target.id;

                let room = e.target.dataset.room;

                if(!currentTarget){
                    socket.emit('startprivate', {
                        id: currentTarget.slice(2), 
                        room: room
                    });
                }
            });

            socket.on('joinroom', function(data){
                let otherid = data.id.find(id => id != socket.id);
                util.$('#id' + otherid).dataset.room = data.room;
            });

            socket.on('private', function(data){
                sendMsg(data.msg, data.id === socket.id);
            });

        }
    }); 


})