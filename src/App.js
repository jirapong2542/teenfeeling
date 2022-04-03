
import { Container, Row, Col } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './2.png';
import Swal from 'sweetalert2'

function App() {



  useEffect(() => {

  }, []);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 10000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })
  Toast.fire({
    icon: 'info',
    title: 'ปรับปรุงชั่วคราว อีก 10 มาทำใหม่'
  })

  return (

    <Container fluid style={{ color: 'white' }} className='p-5'>

      {/* <div className="cardmoon">
        <img src={logo} className="logo" />
        <div className="head">
           <h1>NIKE AM90id</h1> 
        </div> 
      </div> */}
      <iframe src='https://solarsystem.nasa.gov/gltf_embed/2366' width='100%' height='450px' frameborder='0' />

    </Container >
  );
}

export default App;