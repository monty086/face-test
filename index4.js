
(function(){

    //1创建画布
    let bgImage = './img/body224.png'
    let stage = new createjs.Stage('stageCanvas');
    let bg = new createjs.Bitmap(bgImage);
    let imgThis

    stage.addChild(bg);
    stage.update();

    createjs.Ticker.setFPS(5);
    createjs.Ticker.addEventListener('tick',tick);

    function tick(event){
        stage.update(event)
    }

    //2 将图片上传、压缩、绘制、提交到face++【二进制的参数】

    let readF = new FileReader();
    let inputImg = $('#inputImg')[0];
    let regImg = /^(?:image\/jpg|image\/jpeg|image\/png)$/i
    let pressImg = $('#compressImg').get(0);
    let yasuo=null;

    $('#inputImg').live('change',function(){
        uploadImg(inputImg)
        $('#inputImg').replaceWith("<input type='file' class='upimg' name:'photo' id='inputImg'>")
    })
    // inputImg.onchange = ()=>{
    //     uploadImg(inputImg)
    // }
    let uploadImg = (img)=>{
        console.dir(img)
        if(img.files.length===0){
            alert('请上传图片')
            return
        }
        let fileImg = img.files[0];
        if(!regImg.test(fileImg.type)){
            alert('上传的图片有误')
            return 
        }
        console.dir(readF)
        readF.readAsDataURL(fileImg)
    }
    readF.onload = (e)=>{
        if(imgThis){
            stage.removeChild(imgThis)
        }
        console.log(e.target.result);
        if(e.target.result){
             pressImg.src = e.target.result
             drawPhoto()
        }
    }
    let drawPhoto = ()=>{
        /* 
            1. 压缩
            2. 绘制
            3. 提交到face++
        */
       $('#loading-wrapper').fadeIn()
       new Promise ((res)=>{
            yasuo = new Compress('canvas')
            if(yasuo){
                res()
            }
       }).then(()=>{
            let data = yasuo.reduce('compressImg',0.1);
            pressImg.src=data
       }).then(()=>{
            pressImg.loadOnce(function(){
                AlloyImage(this).act('灰度处理').add(AlloyImage(this.width,this.height,'#aaa'),'叠加').replace(this)
            })
       }).then(()=>{
            uploadFace()
       })
    }

    let uploadFace =()=>{
        let url = pressImg.src
        //base64转二进制发给face++
        let formData = new FormData();
        if(url){
            let blobData = baseToBlob(url);
            formData.append('api_key','0uGS88Rvq1uUP1-yLciG1WrnOyCSzhMY');
            formData.append('api_secret','-c5Ttwzd5kKTyhlGqX4fbCe8_BDU1frB');
            formData.append('image_file',blobData)
        }

        $.ajax({
            url:'https://api-cn.faceplusplus.com/facepp/v3/detect',
            data:formData,
            type:'POST',
            contentType:false,
            processData:false,
            success:(json)=>{
                console.log(json)
                if(json&&json.faces.length!=0){
                    let face = json.faces[0].face_rectangle
                    elePos={
                        x:face.left,
                        y:face.top,
                        s:1,
                        a:0,
                        w:face.width,
                        h:face.height,
                    }
                    $('.upload-box').fadeIn()
                    drawFace()
                    $('#loading-wrapper').fadeOut()
                }
            },
            error:(error)=>{
                console.log(error)
            }
        })
    }

    let baseToBlob = (url)=>{
        let arr = url.split(',');
        let mime = arr[0].match(/:(.*);/)[1];
        let n = arr[1].length;
        let atob = window.atob(arr[1])
        let unit = new Uint8Array(n)
        while(n--){
            unit[n] = atob.charCodeAt(n)
        }
        return new Blob([unit],{
            type:mime
        })
    }

    let drawFace = ()=>{
        let url = pressImg.src;
        imgThis = new createjs.Bitmap(url);
        setTimeout(()=>{
            let designWidth = 58 ;
            let designX = 238;
            let desighY = 347

            let scaleSize = designWidth/elePos.w;
            let nowX = elePos.x*scaleSize;
            let nowY = elePos.y*scaleSize;

            let fx = designX-nowX;
            let fy  = desighY-nowY;

            elePos.s = scaleSize;
            elePos.x = fx;
            elePos.y = fy;

            imgThis.scaleX = elePos.s;
            imgThis.scaleY = elePos.s;
            imgThis.rotation = elePos.a;
            imgThis.x = elePos.x;
            imgThis.y = elePos.y;

            stage.addChild(imgThis);
            stage.swapChildren(bg,imgThis);
            stage.update()

            toDataImg()
        },200)
    }

    $(document).on('touchend','.upload-box .close' , function(){
        $('.upload-box').fadeOut()
    })

    let toDataImg = ()=>{

        var canvas = document.getElementById("canvas"),//获取canvas
            ctx = canvas.getContext("2d"), //对应的CanvasRenderingContext2D对象(画笔)
            img = new Image();//创建新的图片对象
           // base64 = '';//base64 
        ctx.drawImage(img, 0, 0);
        var base64 = canvas.toDataURL("image/png");
        img.setAttribute("crossOrigin", 'Anonymous')
        img.onload = function () {//图片加载完，再draw 和 toDataURL
            
        };

        $('#downloadImg').attr('src',base64)
        setTimeout(()=>{
            data = yasuo.reduce('downloadImg',0.1)
            $('#downloadImg').attr('src',data)
        },200)
    }
})()