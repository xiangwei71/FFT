// 參考資料

// DFT
// https://blog.csdn.net/sac761/article/details/76525188?fbclid=IwAR3S5ForwXvr3N2Cb44iRz6naGqq1KiwM2GXCBMd4kDqLaG3ej3hGKm-H6I

// FFT原理
// https://ccjou.wordpress.com/2012/05/25/%E5%BF%AB%E9%80%9F%E5%82%85%E7%AB%8B%E8%91%89%E8%BD%89%E6%8F%9B/?fbclid=IwAR0cKxfMMt9AZYsKBqt60Ko1ojiO5_jnoqW1Tqt8TIl3U1N3NBzGK4-tpe0

// FFT蝴蝶算法
// https://developer.nvidia.com/sites/all/modules/custom/gpugems/books/GPUGems2/elementLinks/48_fft_01.jpg?fbclid=IwAR2H-0eU76Zdzrvrn_MPJDliacIK6MSIuLEh060NvqEWKjb1Zxnvb2el7mQ

// 二維FFT to 2個一維FFT
// https://zhuanlan.zhihu.com/p/36377799?fbclid=IwAR3NN4Bjy3aZtE1d8VANJM0gown7Cc_XQPH6SxrlZkjmXV4cZsWNErwOdq0

function Complex(x, y) {
    this.x = x; // real
    this.y = y; // image

    this.add = (c, result) => {
        result.x = this.x + c.x;
        result.y = this.y + c.y;
    }

    this.minus = (c, result) => {
        result.x = this.x - c.x;
        result.y = this.y - c.y;
    }

    this.multiply = (c, result) => {
        var x = this.x;
        var y = this.y;
        var a = c.x;
        var b = c.y;
        result.x = a * x - b * y;
        result.y = a * y + b * x;
    }

    this.rewrite = (c) => {
        this.x = c.x;
        this.y = c.y;
    }
}

/**
 *                               power
 * @param {*} power     \  /\  /
 * @param {*} N          \/  \/  N
 */
function W(power, N) {
    var theda = power * -2 * Math.PI / N;
    return new Complex(Math.cos(theda), Math.sin(theda));
}


function str_reverse(str) {
    return str.split("").reverse().join("");
}

function zero_str(count) {
    var a = new Array(count);
    return a.fill(0).join("");
};

function bit_reverse(value, bit_length) {
    var bit_str = value.toString(2);

    //補0
    if (bit_str.length != bit_length) {
        var zero_count = bit_length - bit_str.length;
        bit_str = zero_str(zero_count) + bit_str;
    }

    var bit_str_reverse = str_reverse(bit_str);
    return parseInt(bit_str_reverse, 2);
}

// 蝴蝶算法的第1步
/**
 * 
 * @param {*} src 
 * @param {*} des 
 * @param {*} h row count
 */
function set_element_order_per_column(src, des, h) {
    var n = Math.log2(h);
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            var c = src[x][bit_reverse(y, n)];
            des[x][y].rewrite(c);
            //console.log(y, bit_reverse(y, n));
        }
    }
}

/**
 * 
 * @param {*} weights 
 * @param {*} src 
 * @param {*} des 
 * @param {*} h row count
 */
function multiply(weights, src, des, h) {
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            src[x][y].multiply(weights[y], des[x][y]);
        }
    }
}

/**
 * 
 * @param {*} src 
 * @param {*} des 
 * @param {*} x 2^n= h ,x < n
 * @param {*} h 
 */
function add_or_minus(src, des, x, h) {
    var offset = Math.pow(2, x);
    // console.log(offset);
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            if (Math.floor(y / offset) % 2 == 0)
                src[x][y].add(src[x][y + offset], des[x][y]);
            else
                src[x][y - offset].minus(src[x][y], des[x][y]);
        }
    }
}

/**
 * 
 * @param {*} N 2^n= N
 * @param {*} order 1~(n-1)
 */
function build_weights(N, order, is_inverse) {
    var sign = is_inverse ? -1 : 1;

    var n = Math.log2(N);
    var w_offset = Math.pow(2, n - 1 - order);
    var repeat = w_offset;

    var count = Math.pow(2, order);
    var weights_subset = new Array(count).fill(new Complex(1, 0));// 複數的單位元是1+0i

    for (var i = 0; i < count; ++i) {
        weights_subset.push(new W(i * w_offset * sign, N));
        // weights_subset.push("W_" + i * w_offset + "_" + N);
    }

    var weights = new Array();
    for (var i = 0; i < repeat; ++i)
        weights = weights.concat(weights_subset);

    return weights;
}

function butterfly(buffer1, buffer2, h, is_inverse) {
    // 蝴蝶算法的第1步:交換位置
    set_element_order_per_column(buffer1, buffer2, h);
    [buffer1, buffer2] = [buffer2, buffer1];

    var N = h;
    var n = Math.log2(N);
    for (var order = 0; order < n - 1; ++order) {
        add_or_minus(buffer1, buffer2, order, h);
        [buffer1, buffer2] = [buffer2, buffer1];

        var weights = build_weights(N, order + 1, is_inverse);
        // console.log(weights);
        multiply(weights, buffer1, buffer2, h);
        [buffer1, buffer2] = [buffer2, buffer1];
    }

    add_or_minus(buffer1, buffer2, n - 1, h);
    [buffer1, buffer2] = [buffer2, buffer1];

    return [buffer1, buffer2];
}

function transpose(src, des, h) {
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y)
            des[x][y].rewrite(src[y][x]);
    }

    return [des, src];
}

function shift(src, des, h) {
    var offset = h / 2;
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y)
            des[x][y].rewrite(src[(x + offset) % h][(y + offset) % h]);
    }

    return [des, src];
}

function log(src, des, h) {
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            des[x][y].x = Math.log2(Math.abs(src[x][y].x));
            des[x][y].y = Math.log2(Math.abs(src[x][y].y));
        }
    }

    return [des, src];
}

function get_min(src, h) {
    var min_x = Number.MAX_VALUE;
    var min_y = Number.MAX_VALUE;
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            min_x = Math.min(src[x][y].x, min_x);
            min_y = Math.min(src[x][y].y, min_y);
        }
    }
    return [min_x, min_y];
}

function get_max(src, h) {
    var max_x = Number.MIN_VALUE;
    var max_y = Number.MIN_VALUE;
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            max_x = Math.max(src[x][y].x, max_x);
            max_y = Math.max(src[x][y].y, max_y);
        }
    }
    return [max_x, max_y];
}

function remap(src, des, h, min, max) {
    var range_x = max[0] - min[0];
    var range_y = max[1] - min[1];

    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            des[x][y].x = (src[x][y].x - min[0]) / range_x;
            des[x][y].y = (src[x][y].y - min[1]) / range_y;
        }
    }
    return [des, src];
}

function clear_center(src, des, h) {
    var center = h / 2 - 0.5;
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            var len = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
            if (len < 20) {
                des[x][y].x = 0;
                des[x][y].y = 0;
            } else {
                des[x][y].rewrite(src[x][y]);
            }
        }
    }

    return [des, src];
}

function test_add_or_minus() {
    var b1 = creat_buffer(8, 8);
    var b2 = creat_buffer(8, 8);

    for (var x = 0; x < 8; ++x) {
        for (var y = 0; y < 8; ++y)
            b1[x][y] = new Complex(y, y);
    }

    add_or_minus(b1, b2, 0, 8);
    console.log(b1);
    console.log(b2);
}

function creat_buffer(w, h) {
    var buffer = new Array(w);
    for (var x = 0; x < w; ++x) {
        buffer[x] = new Array(h);

        for (var y = 0; y < h; ++y)
            buffer[x][y] = new Complex(0, 0);
    }
    return buffer;
}

function pow(src, des, h, power) {
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            des[x][y].x = Math.pow(src[x][y].x, power);
            des[x][y].y = Math.pow(src[x][y].y, power);
        }
    }

    return [des, src];
}

function FFT(buffer1, buffer2, h) {
    /*二維DFT可以分解成 2次一維DFT
    B=MX
    Y=M(B)T
    */

    [buffer1, buffer2] = butterfly(buffer1, buffer2, h, false);
    [buffer1, buffer2] = transpose(buffer1, buffer2, h);
    [buffer1, buffer2] = butterfly(buffer1, buffer2, h, false);

    return [buffer1, buffer2];
}

function IFFT(buffer1, buffer2, h) {
    [buffer1, buffer2] = butterfly(buffer1, buffer2, h, true);
    [buffer1, buffer2] = transpose(buffer1, buffer2, h);
    [buffer1, buffer2] = butterfly(buffer1, buffer2, h, true);
    var m = new Array(h).fill(new Complex(1 / h / h, 0));
    multiply(m, buffer1, buffer2, h);
    [buffer1, buffer2] = [buffer2, buffer1];

    return [buffer1, buffer2];
}

//
function visualize(buffer1, buffer2, h) {

    [buffer1, buffer2] = log(buffer1, buffer2, h);
    var min = get_min(buffer1, h);
    var max = get_max(buffer1, h);
    // console.log(min, max);

    [buffer1, buffer2] = remap(buffer1, buffer2, h, min, max);

    // min = get_min(buffer1, h);
    // max = get_max(buffer1, h);
    // console.log(min, max);

    [buffer1, buffer2] = transpose(buffer1, buffer2, h);

    //brightness
    [buffer1, buffer2] = pow(buffer1, buffer2, h, 1.2);

    return [buffer1, buffer2];
}

window.onload = () => {
    var img = document.getElementsByTagName("img")[0];
    var w = img.width;
    var h = img.height;

    // fill source
    source.width = w;
    source.height = h;
    var source_ctx = source.getContext("2d");
    source_ctx.drawImage(img, 0, 0, w, h);

    // hold source data array
    var source_data = source_ctx.getImageData(0, 0, w, h);
    var source_data_array = source_data.data;

    // hold canvas data array
    canvas.width = w;
    canvas.height = h;
    var draw_ctx = canvas.getContext("2d");
    var canvas_data = draw_ctx.getImageData(0, 0, w, h);
    var canvas_data_array = canvas_data.data;

    // init buffer
    var buffer1 = creat_buffer(w, h);
    var buffer2 = creat_buffer(w, h);

    // https://stackoverflow.com/questions/46863683/speed-up-canvass-getimagedata
    // copy from source to buffer1
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var index = 4 * (x + y * w);
            var int_value = source_data_array[index];
            var f_value = int_value / 255; // to 0~1
            buffer1[x][y].x = f_value;
        }
    }

    // de gamma
    [buffer1, buffer2] = pow(buffer1, buffer2, h, 2.2);

    // FFT
    [buffer1, buffer2] = FFT(buffer1, buffer2, h);

    [buffer1, buffer2] = shift(buffer1, buffer2, h);
    [buffer1, buffer2] = clear_center(buffer1, buffer2, h);
    [buffer1, buffer2] = shift(buffer1, buffer2, h);

    // [buffer1, buffer2] = visualize(buffer1, buffer2, h);

    // IFFT
    [buffer1, buffer2] = IFFT(buffer1, buffer2, h);

    // gamma
    [buffer1, buffer2] = pow(buffer1, buffer2, h, 1 / 2.2);

    console.log(buffer1);
    // console.log(buffer2);


    // copy from buffer to canvas
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var index = 4 * (x + y * w);

            var f_value = buffer1[x][y].x;
            var int_value = Math.round(255 * f_value); // to 0~255

            canvas_data_array[index++] = int_value;
            canvas_data_array[index++] = int_value;
            canvas_data_array[index++] = int_value;
            canvas_data_array[index] = 255;
        }
    }
    draw_ctx.putImageData(canvas_data, 0, 0);
    console.log("finish");

    // test add_or_minus()
    // test_add_or_minus();

    // test code
    // var c = new Complex(1, 2);
    // var c2 = new Complex(2, 4);
    // var c3 = new Complex(0, 0);
    // c.multiply(c2, c3);
    // console.log(c3);

    // test W
    // var N = 16;
    // for (var i = 0; i < N + 1; ++i) {
    //     console.log(new W(i, N));
    // }

    // var weights = build_weights(16, 1,false);
    // console.log(weights);
};