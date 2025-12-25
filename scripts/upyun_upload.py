import upyun
import os
import requests
import time
import random

from dotenv import load_dotenv
load_dotenv(".env")

username = os.getenv('UPYUN_USERNAME')
password = os.getenv('UPYUN_PASSWORD')

if not username or not password:
    raise ValueError("请设置 UPYUN_USERNAME 和 UPYUN_PASSWORD 环境变量")



def get_filename(image_url):
    # 获取图片名称
    filename = image_url.split("/")[-1]

    # 判断是否以图片格式结尾
    if filename.endswith(".png") or \
        filename.endswith(".jpg") or \
        filename.endswith(".jpeg") or \
        filename.endswith(".gif") or \
        filename.endswith(".webp") or \
        filename.endswith(".mp4") or \
        filename.endswith(".svg") :

        if len(filename) > 50:
            filename = filename[len(filename)-50:]
        elif len(filename) < 5:
            random_num = str(random.randint(100, 999))
            filename = random_num + "_" + filename

        # 在原文名的基础上去掉特殊字符
        filename = filename.replace("*", "").replace("?", "").replace(":", "").replace("|", "")
        filename = filename.replace("\\", "").replace("/", "").replace(" ", "").replace("%", "")

    
    else:
        # 生产一个 8 为的随机数
        random_num = str(random.randint(10000000, 99999999))
        if "webp" in filename:
            filename = random_num + "_image.webp"
        elif "svg" in filename:
            filename = random_num + "_image.svg"
        elif "gif" in filename:
            filename = random_num + "_image.gif"
        elif "png" in filename:
            filename = random_num + "_image.png"
        elif "jpeg" in filename:
            filename = random_num + "_image.jpeg"
        elif "mp4" in filename:
            filename = random_num + "_video.mp4"
        else:
            filename = random_num + "_image.jpg"


    filename = time.strftime('%Y/%m/%d/',time.localtime(time.time())) + filename
    return filename

def upload_img(image_url):
    if image_url.startswith("https://img.learnblockchain.cn/"):
        return image_url

    up = upyun.UpYun("image-learnblog", 
                    username, 
                    password, 
                    timeout=60, 
                    endpoint=upyun.ED_AUTO)

    filename = get_filename(image_url)
    upload_url = "https://img.learnblockchain.cn/" + filename

    # 如果图片可访问，说明已经上传过，则直接返回
    try:
        r = requests.get(upload_url)
        if r.status_code == 200:
            return upload_url;
    except Exception as e:
        pass

    try:
        r = requests.get(image_url)
        if r.status_code == 200:
            up.put(filename, r.content)
            return upload_url;
        else:
            print(f"上传图片失败: {r.status_code}")
            return None
                    
    except Exception as e:
        print(f"处理图片失败: {image_url}, 错误: {str(e)}")
    
    return None 


def upload_imgfile(file_path):
    up = upyun.UpYun("image-learnblog", 
                    username, 
                    password, 
                    timeout=60, 
                    endpoint=upyun.ED_AUTO)
    
    uploadFileName = get_filename("")
    upload_url = "https://img.learnblockchain.cn/" + uploadFileName

    with open(file_path, "rb") as f:
        up.put(uploadFileName, f.read())
    print(f"上传图片成功: {upload_url}")
    return upload_url



if __name__ == "__main__":
    print(upload_img("https://www.helius.dev/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fsanctum-swap-interface.webp&w=3840&q=90"))
