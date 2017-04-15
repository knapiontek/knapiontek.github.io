
function Canvas(element, size_x, size_y) {
    var _that = {}

    _that.element = $(element)
    _that.size_x = size_x
    _that.size_y = size_y
    _that.canvas = $('<canvas>')

    var canvas = _that.canvas.get(0);
    canvas.id = 'system';
    canvas.width = size_x
    canvas.height = size_y
    _that.element.append(canvas)

    _that.context = canvas.getContext('2d')
    _that.context.clearRect(0, 0, size_x, size_y)

    _that.erase = function() {
        _that.context.lineWidth = 1
        _that.context.setLineDash([])
        _that.context.clearRect(0, 0, size_x, size_y)
    }

    _that.text = function(text, pt) {
        var x = pt.x * _that.canvas.width() / _that.size_x
        var y = pt.y * _that.canvas.height() / _that.size_y

        var div = $('<div>').get(0);
        div.style.position = 'absolute';
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.z_index = '1'
        katex.render(text, div, {displayMode: false})
        _that.element.append(div)
    }

    _that.Path = function(style) {
        var that = {}

        that.style = style
        that.context = _that.context

        that.context.beginPath()

        if(style) {
            if(style.width) {
                that.context.lineWidth = style.width
            }
            if(style.dash) {
                that.context.setLineDash(style.dash)
            }
        }

        that.style = function() {
            if(that.style) {
                return that.style
            } else {
                return {
                    width: that.context.lineWidth,
                    dash: that.context.getLineDash()
                }
            }
        }

        that.move_to = function(pt) {
            that.context.moveTo(pt.x, pt.y)
        }

        that.line_to = function(pt) {
            that.context.lineTo(pt.x, pt.y)
        }

        that.stroke = function(pt) {
            that.context.stroke()
        }

        that.pike = function(begin, end, style) {
            that.style(style)

            var line = {x: end.x - begin.x, y: end.y - begin.y}
            var len = Math.sqrt((line.x * line.x) + (line.y * line.y))
            var unit = {x: line.x / len, y: line.y / len}

            var v = 15
            var h = 4
            var left = {
                x: end.x - (v * unit.x) + (h * unit.y),
                y: end.y - (v * unit.y) - (h * unit.x)
            }
            var right = {
                x: end.x - (v * unit.x) - (h * unit.y),
                y: end.y - (v * unit.y) + (h * unit.x)
            }

            that.context.moveTo(end.x, end.y)
            that.context.lineTo(left.x, left.y)
            that.context.lineTo(right.x, right.y)
            that.context.fill()
        }

        that.line = function(begin, end, style) {
            that.style(style)

            that.context.moveTo(begin.x, begin.y)
            that.context.lineTo(end.x, end.y)
            that.context.stroke()
        }

        that.pike_line = function(begin, end, style) {
            that.pike(begin, end, style)

            that.context.moveTo(begin.x, begin.y)
            that.context.lineTo(end.x, end.y)
            that.context.stroke()
        }

        that.dot = function(pt, style) {
            that.style(style)

            that.context.beginPath()
            that.context.arc(pt.x, pt.y, 5, 0, 2*Math.PI)
            that.context.fill()
        }

        return that

    }

    return _that
}

function Point2D(x, y) {
    var that = {x: x, y: y}

    that.add = function(pt) {
        return Point2D(that.x + pt.x, that.y + pt.y)
    }

    that.sub = function(pt) {
        return Point2D(that.x - pt.x, that.y - pt.y)
    }

    that.mul = function(no) {
        return Point2D(that.x * no, that.y * no)
    }

    that.div = function(no) {
        return Point2D(that.x / no, that.y / no)
    }

    that.norm2 = function() {
        return that.x * that.x + that.y * that.y
    }

    that.norm = function() {
        return Math.sqrt(that.norm2())
    }

    that.unit = function() {
        return that.div(that.norm())
    }

    that.dot = function(pt) {
        return that.x * pt.x + that.y * pt.y
    }

    that.rot = function(pt) {
        return that.x * pt.y - that.y * pt.x
    }

    return that
}

function Vector(arg) {
    var that = {}

    if($.isNumeric(arg)) {
        var size = arg
        that.data = []
        for(var i = 0; i < size; i++) {
            that.data[i] = 0.0
        }
    } else if($.isArray(arg)) {
        that.data = arg
    } else {
        console.assert(false)
    }

    that.add = function(vec) {
        console.assert(that.data.length == vec.data.length)
        for(var i = 0; i < that.data.length; i++) {
            that.data[i] += vec[i]
        }
        return that
    }

    that.sub = function(vec) {
        console.assert(that.data.length == vec.data.length)
        for(var i = 0; i < that.data.length; i++) {
            that.data[i] -= vec[i]
        }
        return that
    }

    that.mul = function(no) {
        for(var i = 0; i < that.data.length; i++) {
            that.data[i] *= no
        }
        return that
    }

    that.div = function(no) {
        for(var i = 0; i < that.data.length; i++) {
            that.data[i] /= no
        }
        return that
    }

    that.norm2 = function(vec) {
        console.assert(that.data.length == vec.data.length)
        var acc = 0.0
        for(var i = 0; i < that.data.length; i++) {
            acc += that.data[i]*vec.data[i] - that.data[i]*vec.data[i]
        }
        return acc
    }

    return that
}

function Matrix(arg, value) {
    var that = {}

    if($.isNumeric(arg)) {
        var size = arg
        that.data = []
        for(var i1 = 0; i1 < size; i1++) {
            that.data[i1] = []
            for(var i2 = 0; i2 < size; i2++) {
                that.data[i1][i2] = 0.0
            }
        }
        
        if(value) {
            for(var i = 0; i < size; i++) {
                that.data[i][i] = value
            }
        }
    } else if($.isArray(arg)) {
        that.data = arg
    } else {
        console.assert(false)
    }

    that.mul = function(vec) {
        console.assert(that.data.length == vec.data.length)
        var out = Vector([])
        for(var i1 = 0; i1 < that.data.length; i1++) {
            var acc = 0.0
            for(var i2 = 0; i2 < vec.data.length; i2++)
                acc += that.data[i1][i2] * vec.data[i2]
            out.data[i1] = acc
        }
        return out
    }

    that.lu = function(vb) {
        // A * X = B
        console.assert(that.data.length == vb.data.length)

        var size = vb.data.length
        var vx = Vector(size)
        var ml = Matrix(size, 1) // lower matrix
        var mu = Matrix(size) // upper matrix
        var vz = Vector(size) // auxiliary vector

        // find L, U where L * U = A
        for(var i1 = 0; i1 < size; i1++) {
            var acc = 0.0
            for(var i2 = 0; i2 < size; i2++)
                acc += ml.data[i1][i2] * mu.data[i2][i1]
            mu.data[i1][i1] = that.data[i1][i1] - acc

            for(var i2 = i1 + 1; i2 < size; i2++) {
                acc = 0.0
                for(var i3 = 0; i3 < i1; i3++)
                    acc += ml.data[i1][i3] * mu.data[i3][i2]
                mu.data[i1][i2] = that.data[i1][i2] - acc

                acc = 0.0
                for(var i3 = 0; i3 < i1; i3++)
                    acc += ml.data[i2][i3] * mu.data[i3][i1]
                ml.data[i2][i1] = (that.data[i2][i1] - acc) / mu.data[i1][i1]
            }
        }

        // finally find result
        for(var i1 = 0; i1 < size; i1++) {
            // find Z where L * Z = B
            var acc = 0.0
            for(var i2 = 0; i2 < i1; i2++)
                acc += ml.data[i1][i2] * vz.data[i2]
            vz.data[i1] = vb.data[i1] - acc
        }
        for(var i1 = size - 1; i1 >= 0; i1--) {
            // find X where U * X = Z
            var acc = 0.0
            for(var i2 = i1; i2 < size; i2++)
                acc += mu.data[i1][i2] * vx.data[i2]
            vx.data[i1] = (vz.data[i1] - acc) / mu.data[i1][i1]
        }
        
        return vx
    }
    
    return that
}

function test_lu() {
    var ma = Matrix([[1, 2], [3, 4]])
    var vb = Vector([5, 11])
    var vx = ma.lu(vb)

    var expected = ma.mul(vx)
    console.assert(expected.norm2(vb) < 0.001)
}

function render_katex() {
    $('.math').each(function() {
        var tex = $(this).text()
        elem = $(this).get(0)
        try {
            katex.render(tex, elem, {displayMode: true})
        }
        catch(err) {
            $(this).html('<span class="error">' + err)
        }
    })
    $('.inmath').each(function() {
        var tex = $(this).text()
        elem = $(this).get(0)
        try {
            katex.render(tex, elem, {displayMode: false})
        }
        catch(err) {
            $(this).html('<span class="error">' + err)
        }
    })
}
