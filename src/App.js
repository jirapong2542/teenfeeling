
import { Container, Row, Col } from 'react-bootstrap';
import './App.css';
import logo from './2.png';
function App() {



  return (

    <Container fluid style={{ color: 'white' }} className='p-5'>

      <div className="cardmoon">
        <img src={logo} className="logo" />
        {/* <div className="head">
           <h1>NIKE AM90id</h1> 
        </div> */}
      </div>


    </Container >
  );
}

export default App;