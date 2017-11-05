function Canvas(anchor) {
    var that = {}

    that.anchor = $(anchor)
    that._style = null

    var canvas = $('<canvas>').get(0);
    canvas.style.width = '100%'
    canvas.width = that.anchor.width()
    canvas.height = that.anchor.height()
    that.anchor.append(canvas)

    that.context = canvas.getContext('2d')
    that.context.clearRect(0, 0, that.anchor.width(), that.anchor.height())

    that.erase = function() {
        that._style = null
        that.context.lineWidth = 1
        that.context.setLineDash([])
        that.context.strokeStyle = '#000000'
        that.context.fillStyle = '#000000'
        that.context.clearRect(0, 0, that.anchor.width(), that.anchor.height())
    }

    that.width = function() {
        return that.anchor.width()
    }

    that.height = function() {
        return that.anchor.height()
    }

    that.style = function(style) {
        if(style) {
            if(that._style != style) {
                if(style.width) {
                    that.context.lineWidth = style.width
                } else {
                    style.width = that.context.lineWidth
                }
                if(style.dash) {
                    that.context.setLineDash(style.dash)
                } else {
                    style.dash = that.context.getLineDash()
                }
                if(style.stroke) {
                    that.context.strokeStyle = style.stroke
                } else {
                    style.stroke = that.context.strokeStyle
                }
                if(style.fill) {
                    that.context.fillStyle = style.fill
                } else {
                    style.fill = that.context.fillStyle
                }
                that._style = style
            }
        } else {
            that._style = {
                width: that.context.lineWidth,
                dash: that.context.getLineDash(),
                stoke_color: that.context.strokeStyle,
                fill: that.context.fillStyle
            }
        }
        return that._style
    }

    that.tex = function(text, pt1, pt2) {
        var x1 = pt1.x
        var y1 = pt1.y

        var jdiv = $('<div>')
        var div = jdiv.get(0);
        div.style.position = 'absolute';
        div.style.left = x1 + 'px';
        div.style.top = y1 + 'px';
        div.style.z_index = '1'
        katex.render(text, div, {displayMode: false})
        that.anchor.append(div)

        if(pt2) {
            var x2 = pt2.x
            var y2 = pt2.y

            var w = jdiv.width()
            var h = jdiv.height()

            x1 = (x1+x2) / 2
            y1 = (y1+y2) / 2

            var rot = Math.atan2(y2-y1, x2-x1)
            var orth = Point2D(y2-y1, x1-x2).unit().mul(h/2)

            div.style.left = (x1+orth.x-w/2) + 'px';
            div.style.top = (y1+orth.y-h/2) + 'px';
            div.style.transform = 'rotate('+rot+'rad)'
        }
    }

    that.pike = function(begin, end, size, style) {
        var line = {x: end.x - begin.x, y: end.y - begin.y}
        var len = Math.sqrt((line.x * line.x) + (line.y * line.y))
        var unit = {x: line.x / len, y: line.y / len}

        var v = 10.0
        var h = 3.0
        if(size) {
            v *= size
            h *= size
        }
        var left = {
            x: end.x - (v * unit.x) + (h * unit.y),
            y: end.y - (v * unit.y) - (h * unit.x)
        }
        var right = {
            x: end.x - (v * unit.x) - (h * unit.y),
            y: end.y - (v * unit.y) + (h * unit.x)
        }

        that.style(style)
        that.context.beginPath()
        that.context.moveTo(end.x, end.y)
        that.context.lineTo(left.x, left.y)
        that.context.lineTo(right.x, right.y)
        that.context.fill()
    }

    that.line = function(begin, end, style) {
        that.style(style)
        that.context.beginPath()
        that.context.moveTo(begin.x, begin.y)
        that.context.lineTo(end.x, end.y)
        that.context.stroke()
    }

    that.pike_line = function(begin, end, size, style) {
        that.style(style)
        that.pike(begin, end, size, style)
        that.context.beginPath()
        that.context.moveTo(begin.x, begin.y)
        that.context.lineTo(end.x, end.y)
        that.context.stroke()
    }

    that.dot = function(pt, radius, style) {
        var _radius = 5
        if(radius) {
            _radius = radius
        }
        that.style(style)
        that.context.beginPath()
        that.context.arc(pt.x, pt.y, _radius, 0, 2*Math.PI)
        that.context.fill()
    }

    that.circle = function(pt, _radius, style) {
        that.style(style)
        that.context.beginPath()
        that.context.arc(pt.x, pt.y, _radius, 0, 2*Math.PI)
        that.context.stroke()
    }

    that.Path = function(style) {
        var path = {}

        path.style = that.style(style)

        that.context.beginPath()

        path.move_to = function(pt) {
            that.style(path.style)
            that.context.moveTo(pt.x, pt.y)
        }

        path.line_to = function(pt) {
            that.style(path.style)
            that.context.lineTo(pt.x, pt.y)
        }

        path.stroke = function() {
            that.context.stroke()
        }

        return path
    }

    that.Chart = function() {
        var chart = {}

        chart.line = function(data, style) {
            var x_min = Number.MAX_VALUE
            var x_max = Number.MIN_VALUE
            var y_min = Number.MAX_VALUE
            var y_max = Number.MIN_VALUE

            for(var i = 0; i < data.length; i += 1) {
                var d = data[i]
                if (d.x < x_min) x_min = d.x
                if (d.x > x_max) x_max = d.x
                if (d.y < y_min) y_min = d.y
                if (d.y > y_max) y_max = d.y
            }

            y_min *= 1.1
            y_max *= 1.1

            var scale_x = that.width() / (x_max - x_min)
            var scale_y = that.height() / (y_max - y_min)

            function scale(pt) {
                return Point2D(scale_x * (pt.x - x_min), that.height() - scale_y * (pt.y - y_min))
            }

            var path = that.Path(style)
            path.move_to(scale(data[0]))
            for(var i = 1; i < data.length; i += 1) {
                path.line_to(scale(data[i]))
            }
            path.stroke()
        }

        chart.dot = function(data, style_function) {
            var x_min = Number.MAX_VALUE
            var x_max = Number.MIN_VALUE
            var y_min = Number.MAX_VALUE
            var y_max = Number.MIN_VALUE

            for(var i = 0; i < data.length; i += 1) {
                var d = data[i]
                if (d.x < x_min) x_min = d.x
                if (d.x > x_max) x_max = d.x
                if (d.y < y_min) y_min = d.y
                if (d.y > y_max) y_max = d.y
            }

            y_min *= 1.1
            y_max *= 1.1

            var scale_x = that.width() / (x_max - x_min)
            var scale_y = that.height() / (y_max - y_min)

            for(var i = 1; i < data.length; i += 1) {
                var d = data[i]
                var style = style_function(d)
                var pt = Point2D(scale_x * (d.x - x_min), that.height() - scale_y * (d.y - y_min))
                that.dot(pt, 1.5, style)
            }
        }

        return chart
    }

    return that
}

function Point2D(x, y) {
    var that = {x: x, y: y}

    that.add = function(arg) {
        if($.isNumeric(arg)) {
            return Point2D(that.x + arg, that.y + arg)
        } else {
            return Point2D(that.x + arg.x, that.y + arg.y)
        }
    }

    that.sub = function(arg) {
        if($.isNumeric(arg)) {
            return Point2D(that.x - arg, that.y - arg)
        } else {
            return Point2D(that.x - arg.x, that.y - arg.y)
        }
    }

    that.mul = function(arg) {
        if($.isNumeric(arg)) {
            return Point2D(that.x * arg, that.y * arg)
        } else {
            return Point2D(that.x * arg, that.y * arg)
        }
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

    that.dup = function() {
        var data = []
        for(var i = 0; i < that.data.length; i++) {
            data[i] = that.data[i]
        }
        return Vector(data)
    }

    that.add = function(arg) {
        if($.isNumeric(arg)) {
            for(var i = 0; i < that.data.length; i++) {
                that.data[i] += arg
            }
        } else {
            console.assert(that.data.length == arg.data.length)
            for(var i = 0; i < that.data.length; i++) {
                that.data[i] += arg.data[i]
            }
        }
        return that
    }

    that.sub = function(arg) {
        if($.isNumeric(arg)) {
            for(var i = 0; i < that.data.length; i++) {
                that.data[i] -= arg
            }
        } else {
            console.assert(that.data.length == arg.data.length)
            for(var i = 0; i < that.data.length; i++) {
                that.data[i] -= arg.data[i]
            }
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
        var acc = 0.0
        if(vec) {
            console.assert(that.data.length == vec.data.length)
            for(var i = 0; i < that.data.length; i++) {
                var diff = that.data[i]-vec.data[i]
                acc += diff*diff
            }
        } else {
            for(var i = 0; i < that.data.length; i++) {
                acc += that.data[i]*that.data[i]
            }
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

    that.dup = function() {
        var data = []
        for(var i1 = 0; i1 < that.data.length; i1++) {
            data[i1] = []
            for(var i2 = 0; i2 < that.data.length; i2++) {
                data[i1][i2] = that.data[i1][i2]
            }
        }
        return Matrix(data)
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
    $('math').each(function() {
        var tex = $(this).text()
        elem = $(this).get(0)
        try {
            katex.render(tex, elem, {displayMode: true})
        }
        catch(err) {
            $(this).html('<span class="error">' + err)
        }
    })
    $('m').each(function() {
        var tex = $(this).text()
        elem = $(this).get(0)
        try {
            katex.render(tex, elem, {displayMode: false})
        }
        catch(err) {
            $(this).html('<span class="error">' + err)
        }
    })

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
