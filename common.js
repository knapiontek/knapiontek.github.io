function arrow(context, begin, end) {
    line = {x: end.x - begin.x, y: end.y - begin.y}
    len = Math.sqrt((line.x * line.x) + (line.y * line.y))
    unit = {x: line.x / len, y: line.y / len}

    v = 15
    h = 4
    left = {
        x: end.x - (v * unit.x) + (h * unit.y),
        y: end.y - (v * unit.y) - (h * unit.x)
    }
    right = {
        x: end.x - (v * unit.x) - (h * unit.y),
        y: end.y - (v * unit.y) + (h * unit.x)
    }

    context.moveTo(begin.x, begin.y)
    context.lineTo(end.x, end.y)
    context.stroke()

    context.moveTo(end.x, end.y)
    context.lineTo(left.x, left.y)
    context.lineTo(right.x, right.y)
    context.fill()
}
function point(x, y) {
        return {x: x, y: y}
}
function point_add(p1, p2) {
    return point(p1.x + p2.x, p1.y + p2.y)
}
function point_mul_no(p, n) {
    return point(p.x * n, p.y * n)
}
function point_div_no(p, n) {
    return point(p.x / n, p.y / n)
}
function vector_zero(size)
{
    vector = []
    for(var i = 0; i < size; i++)
    {
        vector[i] = 0.0
    }
    return vector
}
function vector_add(vec1, vec2)
{
    console.assert(vec1.length == vec2.length)

    vector = []
    for(var i = 0; i < vec1.length; i++)
    {
        vector[i] = vec1[i] + vec2[i]
    }
    return vector
}
function vector_mul_no(vec1, no)
{
    vector = []
    for(var i = 0; i < vec1.length; i++)
    {
        vector[i] = vec1[i] * no
    }
    return vector
}
function vector_add_no(vec1, no)
{
    vector = []
    for(var i = 0; i < vec1.length; i++)
    {
        vector[i] = vec1[i] + no
    }
    return vector
}
function vector_norm2(vec1, vec2)
{
    console.assert(vec1.length == vec2.length)

    var acc = 0.0
    for(var i = 0; i < vec1.length; i++)
    {
        acc += (vec1[i] * vec1[i]) - (vec2[i] * vec2[i])
    }
    return acc
}
function square_matrix_zero(size)
{
    matrix = []
    for(var i1 = 0; i1 < size; i1++)
    {
        matrix[i1] = []
        for(var i2 = 0; i2 < size; i2++)
        {
            matrix[i1][i2] = 0.0
        }
    }
    return matrix
}
function square_matrix_identity(size)
{
    matrix = []
    for(var i1 = 0; i1 < size; i1++)
    {
        matrix[i1] = []
        for(var i2 = 0; i2 < size; i2++)
        {
            matrix[i1][i2] = Number(i1 == i2)
        }
    }
    return matrix
}
function square_matrix_mul(matrix, in_vec)
{
    console.assert(matrix[0].length == in_vec.length)

    out_vec = []
    for(var i1 = 0; i1 < matrix.length; i1++)
    {
        var acc = 0.0
        for(var i2 = 0; i2 < in_vec.length; i2++)
            acc += matrix[i1][i2] * in_vec[i2]
        out_vec[i1] = acc
    }
    return out_vec
}
function calculate_equation_system(A, B) // solving A * X = B by LU method
{
    console.assert(A.length == B.length)

    var size = B.length
    var X = vector_zero(size)
    var L = square_matrix_identity(size) // lower matrix
    var U = square_matrix_zero(size) // upper matrix
    var Z = vector_zero(size) // auxiliary vector

    // find L, U where L * U = A
    for(var i1 = 0; i1 < size; i1++)
    {
        var acc = 0.0
        for(var i2 = 0; i2 < size; i2++)
            acc += L[i1][i2] * U[i2][i1]
        U[i1][i1] = A[i1][i1] - acc

        for(var i2 = i1 + 1; i2 < size; i2++)
        {
            acc = 0.0
            for(var i3 = 0; i3 < i1; i3++)
                acc += L[i1][i3] * U[i3][i2]
            U[i1][i2] = A[i1][i2] - acc

            acc = 0.0
            for(var i3 = 0; i3 < i1; i3++)
                acc += L[i2][i3] * U[i3][i1]
            L[i2][i1] = (A[i2][i1] - acc) / U[i1][i1]
        }
    }

    // finally find result
    for(var i1 = 0; i1 < size; i1++)
    {
        // find Z where L * Z = B
        var acc = 0.0
        for(var i2 = 0; i2 < i1; i2++)
            acc += L[i1][i2] * Z[i2]
        Z[i1] = B[i1] - acc
    }
    for(var i1 = size - 1; i1 >= 0; i1--)
    {
        // find X where U * X = Z
        var acc = 0.0
        for(var i2 = i1; i2 < size; i2++)
            acc += U[i1][i2] * X[i2]
        X[i1] = (Z[i1] - acc) / U[i1][i1]
    }
    
    // return
    return X
}
function test_calculate_equation_system() {
    var size = 2
    var A = [[1, 2], [3, 4]]
    var B = [5, 11]
    var X = calculate_equation_system(A, B)

    var E = square_matrix_mul(A, X)
    console.assert(vector_norm2(E, B))
}
function render_katex() {
    $('.math').each(function() {
        var texTxt = $(this).text()
        elem = $(this).get(0)
        try {
            katex.render(texTxt, elem, { displayMode: true })
        }
        catch(err) {
            $(this).html('<span class="error">' + err)
        }
    })
    $('.inmath').each(function() {
        var texTxt = $(this).text()
        elem = $(this).get(0)
        try {
            katex.render(texTxt, elem, { displayMode: false })
        }
        catch(err) {
            $(this).html('<span class="error">' + err)
        }
    })
}
