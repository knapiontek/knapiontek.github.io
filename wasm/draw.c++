extern "C" {

extern void js_func(int i);

void cxx_func(void) {
  js_func(667);
}

}

