(module
  (type $type0 (func (param i32)))
  (type $type1 (func))
  (import $import0 "env" "js_func"  (param i32))
  (table 0 anyfunc)
  (memory 1)
  (export "memory" memory)
  (export "cxx_func" $func1)
  (func $func1
    i32.const 667
    call $import0
  )
)
